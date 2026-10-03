import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { createServer } from 'node:net'
import { spawn } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const appRoot = fileURLToPath(new URL('../', import.meta.url))
const availablePort = async () => {
  const probe = createServer()
  await new Promise((resolve, reject) => { probe.once('error', reject); probe.listen(0, '127.0.0.1', resolve) })
  const { port } = probe.address()
  await new Promise((resolve, reject) => probe.close((error) => error ? reject(error) : resolve()))
  return port
}
const slug = process.argv[2]
if (!slug || !/^[a-z0-9-]+$/.test(slug)) { console.error('Usage: npm run inspect -- <presentation-slug>'); process.exit(2) }
const output = resolve(appRoot, 'artifacts', 'presentation-inspection', slug)
await mkdir(output, { recursive: true })
const port = await availablePort()
const server = spawn(process.execPath, [fileURLToPath(new URL('../node_modules/vite/bin/vite.js', import.meta.url)), 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { cwd: appRoot, stdio: 'ignore' })
let browser
try {
  let ready = false
  const baseUrl = `http://127.0.0.1:${port}`
  for (let i = 0; i < 60; i++) {
    if (server.exitCode !== null) throw new Error('Preview server exited before becoming ready')
    try { if ((await fetch(baseUrl)).ok) { ready = true; break } } catch {}
    await delay(250)
  }
  if (!ready) throw new Error('Preview did not start; run npm run build first')
  browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1440, height: 960 } })
  await page.goto(`${baseUrl}/${slug}`, { waitUntil: 'networkidle' })
  const footer = page.locator('[data-presentation-footer]')
  if (!await footer.count()) throw new Error(`No presentation found at /${slug}`)
  const count = Number(await footer.getAttribute('data-step-count'))
  if (!count) throw new Error(`Presentation at /${slug} has no steps`)
  const warnings = []
  for (let index = 0; index < count; index++) {
    await footer.waitFor({ state: 'visible' })
    await page.waitForTimeout(700)
    await page.screenshot({ path: resolve(output, `step-${String(index + 1).padStart(2, '0')}.png`), fullPage: true })
    const diagnostics = await page.evaluate(() => {
      const warnings = []
      const active = document.querySelector('[data-presentation-progress-item][data-presentation-active="true"]')
      if (active && getComputedStyle(active).outlineStyle === 'none' && getComputedStyle(active).backgroundColor === getComputedStyle(active.parentElement).backgroundColor) warnings.push('active progress state may be visually indistinct')
      const attribution = document.querySelector('[data-presentation-attribution]')
      if (!attribution) warnings.push('missing attribution')
      else if (parseFloat(getComputedStyle(attribution).fontSize) < 11 || getComputedStyle(attribution).color === 'rgb(0, 0, 238)' || getComputedStyle(attribution).color === 'rgb(85, 26, 139)') warnings.push('attribution may be browser-default or undersized')
      const texts = [...document.querySelectorAll('body *')].filter((el) => el.children.length === 0 && el.textContent.trim() && el.getClientRects().length)
      for (let i = 0; i < texts.length; i++) for (let j = i + 1; j < texts.length; j++) {
        if (texts[i].closest('[data-presentation-allow-overlap]') || texts[j].closest('[data-presentation-allow-overlap]')) continue
        const a = texts[i].getBoundingClientRect(), b = texts[j].getBoundingClientRect()
        if (a.width && a.height && b.width && b.height && a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top) { warnings.push(`visible text overlap: ${texts[i].textContent.trim()} / ${texts[j].textContent.trim()}`); break }
      }
      return warnings
    })
    for (const warning of diagnostics) warnings.push(`step ${index + 1}: ${warning}`)
    if (index + 1 < count) { await page.keyboard.press('ArrowRight'); await page.waitForFunction((expected) => Number(document.querySelector('[data-presentation-footer]')?.getAttribute('data-step-index')) === expected, index + 1) }
  }
  console.log(`Captured ${count} settled screenshots in ${output}`)
  for (const warning of [...new Set(warnings)]) console.warn(`WARN: ${warning}`)
} catch (error) { console.error(`Inspection failed: ${error.message}`); process.exitCode = 1 }
finally {
  await browser?.close()
  if (server.exitCode === null) {
    await new Promise((resolve) => {
      server.once('exit', resolve)
      if (server.exitCode === null) server.kill('SIGTERM')
      else resolve()
    })
  }
}
