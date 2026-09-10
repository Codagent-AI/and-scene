import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { spawn } from 'node:child_process'
import { createServer } from 'node:net'
import { chromium } from 'playwright'

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
    const attribution = page.locator('[data-presentation-attribution]')
    const fontSize = await attribution.evaluate((element) => Number.parseFloat(getComputedStyle(element).fontSize))
    if (fontSize < 10) console.warn(`inspect: advisory step ${index + 1}: attribution is undersized; style [data-presentation-attribution] locally`)
    const active = page.locator('[data-presentation-active]').first()
    if (await active.count() && await active.evaluate((element) => getComputedStyle(element).color === getComputedStyle(element.parentElement).color)) console.warn(`inspect: advisory step ${index + 1}: active chrome may be indistinct; style [data-presentation-active] locally`)
  }
  await browser.close()
  console.log(`inspect: screenshots written to ${output}`)
} finally {
  preview.kill()
}
