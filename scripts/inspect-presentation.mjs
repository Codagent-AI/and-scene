import { mkdir, readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { createServer } from 'node:net'
import { spawn } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { readPresentationSlugs } from './presentation-registry.mjs'

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
const registry = await readFile(resolve(appRoot, 'src/presentations/index.ts'), 'utf8')
if (!readPresentationSlugs(registry).includes(slug)) { console.error(`No presentation found at /${slug}`); process.exit(1) }
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
  try { await footer.waitFor({ timeout: 5000 }) } catch { throw new Error(`No presentation found at /${slug}`) }
  const count = Number(await footer.getAttribute('data-step-count'))
  if (!count) throw new Error(`Presentation at /${slug} has no steps`)
  const warnings = []
  for (let index = 0; index < count; index++) {
    await footer.waitFor({ state: 'visible' })
    await page.waitForFunction((expected) => Number(document.querySelector('[data-presentation-footer]')?.getAttribute('data-step-index')) === expected, index)
    await page.waitForFunction(() => document.getAnimations().every((animation) => animation.playState !== 'running'), null, { timeout: 10000 }).catch(() => {})
    await page.waitForTimeout(700)
    await page.screenshot({ path: resolve(output, `step-${String(index + 1).padStart(2, '0')}.png`), fullPage: true })
    const diagnostics = await page.evaluate(() => {
      const result = []
      const color = (value) => value.replaceAll(' ', '')
      const visible = (element) => { const rect = element.getBoundingClientRect(), style = getComputedStyle(element); return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none' }
      const distinguishable = (active, inactive) => {
        if (!active || !inactive) return true
        const a = getComputedStyle(active), b = getComputedStyle(inactive)
        return color(a.color) !== color(b.color) || color(a.backgroundColor) !== color(b.backgroundColor) || color(a.borderColor) !== color(b.borderColor) || a.fontWeight !== b.fontWeight || a.outlineStyle !== b.outlineStyle
      }
      for (const [label, selector] of [['progress', '[data-presentation-progress-item]'], ['table of contents', '[data-presentation-toc-item]']]) {
        const controls = [...document.querySelectorAll(selector)]
        const active = controls.find((element) => element.getAttribute('data-presentation-active') === 'true')
        const inactive = controls.find((element) => element.getAttribute('data-presentation-active') !== 'true')
        if (active && inactive && !distinguishable(active, inactive)) result.push(`active ${label} state may be visually indistinguishable from inactive controls`)
      }
      const attribution = document.querySelector('[data-presentation-attribution]')
      if (!attribution || !visible(attribution)) result.push('missing or hidden attribution')
      else {
        const style = getComputedStyle(attribution)
        if (parseFloat(style.fontSize) < 11 || ['rgb(0, 0, 238)', 'rgb(85, 26, 139)'].includes(style.color)) result.push('attribution may be browser-default or undersized; style [data-presentation-attribution]')
      }
      const textNodes = [...document.querySelectorAll('body *')].filter((element) => element.children.length === 0 && element.textContent.trim() && visible(element))
      for (let i = 0; i < textNodes.length; i++) for (let j = i + 1; j < textNodes.length; j++) {
        const a = textNodes[i], b = textNodes[j]
        if (a.closest('[data-presentation-allow-overlap]') || b.closest('[data-presentation-allow-overlap]')) continue
        const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect()
        if (ra.left < rb.right && ra.right > rb.left && ra.top < rb.bottom && ra.bottom > rb.top) {
          result.push(`unmarked visible text/chrome overlap: "${a.textContent.trim()}" / "${b.textContent.trim()}"`)
        }
      }
      return result
    })
    for (const warning of diagnostics) warnings.push(`step ${index + 1}: ${warning}`)
    if (index + 1 < count) {
      await page.keyboard.press('ArrowRight')
      await page.waitForFunction((expected) => Number(document.querySelector('[data-presentation-footer]')?.getAttribute('data-step-index')) === expected, index + 1, { timeout: 5000 })
    }
  }
  console.log(`Captured ${count} settled screenshots in ${output}`)
  for (const warning of [...new Set(warnings)]) console.warn(`WARN: ${warning}`)
  if (!warnings.length) console.log('No visual advisories detected.')
} catch (error) { console.error(`Inspection failed: ${error.message}`); process.exitCode = 1 }
finally {
  await browser?.close()
  if (server.exitCode === null) await new Promise((resolve) => { server.once('exit', resolve); if (server.exitCode === null) server.kill('SIGTERM'); else resolve() })
}
