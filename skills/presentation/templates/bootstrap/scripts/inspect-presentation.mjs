import { spawn } from 'node:child_process'
import { mkdir } from 'node:fs/promises'
import { setTimeout as delay } from 'node:timers/promises'
import { chromium } from 'playwright'
import { readFile } from 'node:fs/promises'
const registry = await readFile(new URL('../src/presentations/index.ts', import.meta.url), 'utf8')
const entries = [...registry.matchAll(/slug:\s*['\"]([^'\"]+)['\"]/g)].map((match) => match[1])

const slug = process.argv[2]
if (!entries.includes(slug)) { console.error(`Unknown presentation: ${slug || '(missing slug)'}`); process.exit(1) }
const host = '127.0.0.1', port = Number(process.env.PREVIEW_PORT || 4180)
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', host, '--port', String(port), '--strictPort'], { stdio: 'ignore' })
let browser
try {
  for (let i = 0; i < 60; i++) { try { if ((await fetch(`http://${host}:${port}/${slug}`)).ok) break } catch {}; await delay(250) }
  browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  await page.goto(`http://${host}:${port}/${slug}`)
  await page.locator('[data-presentation]').waitFor()
  const count = Number(await page.locator('[data-step-count]').getAttribute('data-step-count'))
  const out = `presentation-artifacts/${slug}`
  await mkdir(out, { recursive: true })
  for (let index = 0; index < count; index++) {
    await page.waitForTimeout(900)
    const warnings = await page.evaluate(() => {
      const result = []
      const texts = [...document.querySelectorAll('[data-presentation] :is(h1,h2,h3,p,a,button,[data-presentation-caption],[data-presentation-live-title],[data-presentation-node])')].filter((el) => el.getClientRects().length)
      const rect = (el) => el.getBoundingClientRect()
      const label = (el) => `${el.tagName.toLowerCase()}${el.className && typeof el.className === 'string' ? `.${el.className.trim().replaceAll(' ', '.')}` : ''} (${(el.textContent || '').trim().replaceAll('\\n', ' ').slice(0, 36)})`
      for (let i = 0; i < texts.length; i++) for (let j = i + 1; j < texts.length; j++) {
        if (texts[i].contains(texts[j]) || texts[j].contains(texts[i]) || texts[i].closest('[data-allow-overlap]') || texts[j].closest('[data-allow-overlap]')) continue
        const a = rect(texts[i]), b = rect(texts[j])
        if (a.width && a.height && b.width && b.height && a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top) result.push(`possible visible text/chrome overlap: ${label(texts[i])} ↔ ${label(texts[j])}`)
      }
      const active = [...document.querySelectorAll('[data-presentation-active="true"]')]
      for (const el of active) {
        const css = getComputedStyle(el), inactive = el.parentElement?.querySelector('[data-presentation-active="false"]')
        if (inactive && css.color === getComputedStyle(inactive).color && css.backgroundColor === getComputedStyle(inactive).backgroundColor && css.fontWeight === getComputedStyle(inactive).fontWeight) result.push('active navigation may look like inactive controls')
      }
      const attribution = document.querySelector('[data-presentation-attribution]')
      if (!attribution) result.push('missing attribution')
      else { const link = attribution.querySelector('a'), css = getComputedStyle(link || attribution); if (!link || Number.parseFloat(css.fontSize) < 11 || css.textDecorationLine === 'underline') result.push('attribution may be browser-default or too small') }
      return [...new Set(result)]
    })
    for (const warning of warnings) console.warn(`WARN step ${index + 1}: ${warning}`)
    await page.screenshot({ path: `${out}/step-${String(index + 1).padStart(2, '0')}.png` })
    if (index < count - 1) await page.keyboard.press('ArrowRight')
  }
  console.log(`Captured ${count} settled step screenshots in ${out}`)
} catch (error) { console.error(`Inspection failed: ${error.message}`); process.exitCode = 1 }
finally { await browser?.close(); server.kill('SIGTERM') }
