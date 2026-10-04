import { spawn } from 'node:child_process'
import { mkdir } from 'node:fs/promises'
import { setTimeout as delay } from 'node:timers/promises'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { readFile } from 'node:fs/promises'
const source = await readFile(new URL('../src/presentations/index.ts', import.meta.url), 'utf8')
const slugs = [...source.matchAll(/slug:\s*['"]([^'"]+)['"]/g)].map((match) => match[1])
const slug = process.argv[2]
if (!slugs.includes(slug)) { console.error(`Unknown presentation "${slug ?? ''}". Registered: ${slugs.join(', ')}`); process.exit(1) }
const port = 4179, base = `http://127.0.0.1:${port}`
const server = spawn(process.execPath, [fileURLToPath(new URL('../node_modules/vite/bin/vite.js', import.meta.url)), 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { stdio: 'ignore' })
let browser
try {
  let ready = false
  for (let i = 0; i < 80; i++) { try { if ((await fetch(base)).ok) { ready = true; break } } catch {}; await delay(250) }
  if (!ready) throw new Error('preview did not become ready at 127.0.0.1')
  browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } }), out = `artifacts/inspect/${slug}`
  await mkdir(out, { recursive: true }); await page.goto(`${base}/${slug}`, { waitUntil: 'networkidle' })
  await page.locator('[data-presentation-stage]').waitFor()
  const count = Number(await page.locator('[data-step-count]').getAttribute('data-step-count') ?? 1)
  for (let i = 0; i < count; i++) {
    await page.waitForTimeout(900)
    await page.screenshot({ path: `${out}/step-${String(i + 1).padStart(2, '0')}.png`, fullPage: true })
    const warnings = await page.evaluate(() => {
      const leaves = [...document.querySelectorAll('body *')].filter((el) => el.children.length === 0 && el.textContent?.trim() && getComputedStyle(el).visibility !== 'hidden')
      const overlaps = []
      for (let a = 0; a < leaves.length; a++) for (let b = a + 1; b < leaves.length; b++) {
        if (leaves[a].closest('[data-allow-overlap]') || leaves[b].closest('[data-allow-overlap]')) continue
        const x = leaves[a].getBoundingClientRect(), y = leaves[b].getBoundingClientRect()
        if (x.width && x.height && y.width && y.height && x.left < y.right && x.right > y.left && x.top < y.bottom && x.bottom > y.top) overlaps.push(`${leaves[a].textContent.trim()} / ${leaves[b].textContent.trim()}`)
      }
      const attr = document.querySelector('[data-presentation-attribution]'), active = document.querySelector('[aria-current="step"]')
      const inactive = document.querySelector('[data-presentation-progress] button:not([aria-current="step"]), [data-presentation-toc] [data-active="false"]')
      const indistinct = active && inactive && ['color', 'backgroundColor', 'opacity'].every((key) => getComputedStyle(active)[key] === getComputedStyle(inactive)[key])
      const attributionBad = !attr || !attr.getAttribute('href') || parseFloat(getComputedStyle(attr).fontSize) < 11 || getComputedStyle(attr).color === 'rgb(0, 0, 238)'
      return { overlaps, indistinct, attributionBad }
    })
    if (warnings.overlaps.length) console.warn(`WARN step ${i + 1}: possible unmarked text overlap: ${warnings.overlaps.join('; ')}`)
    if (warnings.indistinct) console.warn(`WARN step ${i + 1}: active progress/ToC state may be indistinct`)
    if (warnings.attributionBad) console.warn(`WARN step ${i + 1}: attribution missing or unpolished; style [data-presentation-attribution]`)
    if (i + 1 < count) { await page.keyboard.press('ArrowRight'); await page.waitForFunction((n) => Number(document.querySelector('[data-step-index]')?.getAttribute('data-step-index')) === n, i + 1) }
  }
  console.log(`PASS: captured ${count} settled screenshots in ${out}`)
} catch (error) { console.error(`FAIL: inspect ${slug}: ${error.message}`); process.exitCode = 1 }
finally {
  await browser?.close()
  server.kill('SIGTERM')
  await new Promise((resolve) => server.once('exit', resolve))
}
