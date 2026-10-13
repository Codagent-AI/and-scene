import { mkdir, readFile } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const slug = process.argv[2]
if (!slug) { console.error('Usage: npm run inspect -- <presentation-slug>'); process.exit(2) }
const registry = await readFile(new URL('../src/presentations/index.ts', import.meta.url), 'utf8')
if (!registry.includes(`'${slug}'`)) { console.error(`Unknown presentation: ${slug}`); process.exit(2) }
const server = spawn(process.execPath, [fileURLToPath(new URL('../node_modules/vite/bin/vite.js', import.meta.url)), 'preview', '--host', '127.0.0.1', '--port', '4174', '--strictPort'], { stdio: 'ignore' })
let browser
try {
  await new Promise(async (resolve, reject) => { for (let i = 0; i < 60; i++) { try { if ((await fetch('http://127.0.0.1:4174')).ok) return resolve() } catch {} await delay(250) } reject(new Error('preview readiness timed out')) })
  browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
  await page.goto(`http://127.0.0.1:4174/${slug}`, { waitUntil: 'networkidle' })
  const count = Number(await page.locator('[data-presentation-root]').getAttribute('data-step-count'))
  await page.locator('[data-presentation-scene]').waitFor()
  await page.waitForTimeout(1200)
  const out = fileURLToPath(new URL(`../artifacts/inspection/${slug}/`, import.meta.url))
  await mkdir(out, { recursive: true })
  for (let i = 0; i < count; i++) {
    await page.waitForTimeout(900)
    await page.screenshot({ path: `${out}/step-${String(i + 1).padStart(2, '0')}.png`, fullPage: true })
    const warnings = await page.evaluate(() => {
      const result = []
      const active = document.querySelector('[data-presentation-progress][data-presentation-active="true"]')
      const idle = document.querySelector('[data-presentation-progress]:not([data-presentation-active="true"])')
      if (active && idle && getComputedStyle(active).backgroundColor === getComputedStyle(idle).backgroundColor && active.getBoundingClientRect().width === idle.getBoundingClientRect().width) result.push('active progress state is indistinct')
      const activeToc = document.querySelector('[data-presentation-toc-entry][data-presentation-active="true"]')
      const idleToc = document.querySelector('[data-presentation-toc-entry]:not([data-presentation-active="true"])')
      if (activeToc && idleToc && getComputedStyle(activeToc).color === getComputedStyle(idleToc).color && getComputedStyle(activeToc).fontWeight === getComputedStyle(idleToc).fontWeight) result.push('active table-of-contents state is indistinct')
      const attribution = document.querySelector('[data-presentation-attribution]')
      if (attribution && (parseFloat(getComputedStyle(attribution).fontSize) < 10 || getComputedStyle(attribution).textDecorationLine === 'underline')) result.push('attribution may need styling via [data-presentation-attribution]')
      const texts = [...document.querySelectorAll('main [data-presentation-entity], main h1, main p, main a, main button')].filter((el) => el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden' && (el.innerText?.trim() || el.getAttribute('aria-label')))
      for (let a = 0; a < texts.length; a++) for (let b = a + 1; b < texts.length; b++) {
        const x = texts[a], y = texts[b]
        if (x.contains(y) || y.contains(x) || x.closest('[data-presentation-allow-overlap]') || y.closest('[data-presentation-allow-overlap]')) continue
        const r = x.getBoundingClientRect(), s = y.getBoundingClientRect()
        if (r.left < s.right && r.right > s.left && r.top < s.bottom && r.bottom > s.top) result.push(`possible overlap: ${x.getAttribute('data-presentation-entity') || x.tagName} / ${y.getAttribute('data-presentation-entity') || y.tagName}`)
      }
      return [...new Set(result)]
    })
    for (const warning of warnings) console.warn(`Advisory step ${i + 1}: ${warning}`)
    if (i < count - 1) { await page.keyboard.press('ArrowRight'); await page.waitForFunction((n) => Number(document.querySelector('[data-presentation-root]')?.getAttribute('data-step-index')) === n, i + 1) }
  }
  console.log(`Captured ${count} settled screenshots under artifacts/inspection/${slug}/`)
} finally { if (browser) await browser.close(); await new Promise((resolve) => { if (server.exitCode !== null) return resolve(); server.once('exit', resolve); server.kill('SIGTERM') }) }
