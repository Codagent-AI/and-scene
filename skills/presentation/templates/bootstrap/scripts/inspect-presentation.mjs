import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { spawn } from 'node:child_process'
import { createServer } from 'node:net'
import { chromium } from 'playwright'
import { attributionWarning, overlapWarnings, stylesAreIndistinct } from './inspection-diagnostics.mjs'

const host = '127.0.0.1'
const slug = process.argv[2]
if (!slug) throw new Error('Usage: npm run inspect -- <presentation-slug>')

function port() {
  return new Promise((resolvePort, reject) => {
    const server = createServer()
    server.once('error', reject)
    server.listen(0, host, () => { const address = server.address(); server.close(() => resolvePort(address.port)) })
  })
}

async function ready(url) {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try { if ((await fetch(url)).ok) return } catch { /* wait */ }
    await new Promise((resolveWait) => setTimeout(resolveWait, 100))
  }
  throw new Error(`preview did not become ready at ${url}`)
}

const previewPort = await port()
const origin = `http://${host}:${previewPort}`
const preview = spawn('npm', ['run', 'preview', '--', '--host', host, '--port', String(previewPort), '--strictPort'], { stdio: 'inherit', shell: process.platform === 'win32' })
try {
  await ready(origin)
  const output = resolve('artifacts/presentation-inspection', slug)
  await mkdir(output, { recursive: true })
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  await page.goto(`${origin}/${slug}`, { waitUntil: 'networkidle' })
  const chrome = page.locator('[data-presentation-chrome]')
  const count = Number(await chrome.getAttribute('data-step-count'))
  if (!Number.isInteger(count) || count < 1) throw new Error(`presentation ${slug} has no inspectable steps`)
  for (let index = 0; index < count; index += 1) {
    await page.locator(`[data-presentation-progress-item][aria-label="Go to step ${index + 1}"]`).click()
    await page.waitForTimeout(700)
    await page.screenshot({ path: resolve(output, `step-${String(index + 1).padStart(2, '0')}.png`), fullPage: true })
    const diagnostics = await page.evaluate(() => {
      const candidates = [...document.querySelectorAll('[data-presentation-entity], [data-presentation-caption], [data-presentation-title], [data-presentation-marker], [data-presentation-progress-item], [data-presentation-toc-item], [data-presentation-controls], [data-presentation-attribution]')].filter((element) => { const style = getComputedStyle(element); const rect = element.getBoundingClientRect(); return style.visibility !== 'hidden' && style.display !== 'none' && Number(style.opacity) > 0 && rect.width > 0 && rect.height > 0 }).map((element) => { const rect = element.getBoundingClientRect(); return { label: element.getAttribute('aria-label') || element.getAttribute('data-presentation-entity') || element.tagName.toLowerCase(), allowed: Boolean(element.closest('[data-presentation-allow-overlap]')), rect: { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom } } })
      const getStyles = (element) => element ? (() => { const style = getComputedStyle(element); return { color: style.color, backgroundColor: style.backgroundColor, borderColor: style.borderColor } })() : null
      const attribution = document.querySelector('[data-presentation-attribution]'); const attributionStyle = attribution ? getComputedStyle(attribution) : null
      return { candidates, active: getStyles(document.querySelector('[data-presentation-progress-item][data-presentation-active], [data-presentation-toc-item][data-presentation-active]')), inactive: getStyles(document.querySelector('[data-presentation-progress-item]:not([data-presentation-active]), [data-presentation-toc-item]:not([data-presentation-active])')), attribution: attributionStyle ? { fontSize: Number.parseFloat(attributionStyle.fontSize), color: attributionStyle.color } : null }
    })
    for (const warning of overlapWarnings(diagnostics.candidates, index + 1)) console.warn(warning)
    if (diagnostics.active && diagnostics.inactive && stylesAreIndistinct(diagnostics.active, diagnostics.inactive)) console.warn(`inspect: advisory step ${index + 1}: active chrome may be indistinct; style [data-presentation-active] locally`)
    const attributionIssue = attributionWarning(diagnostics.attribution)
    if (attributionIssue) console.warn(attributionIssue)
  }
  await browser.close()
  console.log(`inspect: screenshots written to ${output}`)
} finally {
  preview.kill()
}
