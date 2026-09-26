import { mkdir } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { setTimeout as delay } from 'node:timers/promises'
import { chromium } from 'playwright'

const slug = process.argv[2]
if (!slug) throw new Error('Usage: npm run inspect -- <presentation-slug>')
const host = '127.0.0.1'
const port = 4173
const origin = `http://${host}:${port}/${slug}`
const vite = fileURLToPath(new URL('../node_modules/vite/bin/vite.js', import.meta.url))
const server = spawn(process.execPath, [vite, 'preview', '--host', host, '--port', String(port), '--strictPort'], { stdio: 'ignore' })
let browser
try {
  let ready = false
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try { if ((await fetch(origin)).ok) { ready = true; break } } catch {}
    await delay(200)
  }
  if (!ready) throw new Error(`Preview did not become ready at ${origin}; run npm run build first`)
  browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
  await page.goto(origin, { waitUntil: 'networkidle' })
  await page.locator('[data-presentation-root]').waitFor()
  const count = Number(await page.locator('[data-presentation-root]').getAttribute('data-step-count'))
  if (!Number.isInteger(count) || count < 1) throw new Error('Presentation did not expose a valid data-step-count')
  const output = `artifacts/presentation-inspection/${slug}`
  await mkdir(output, { recursive: true })
  for (let index = 0; index < count; index += 1) {
    await page.waitForTimeout(1000)
    await page.screenshot({ path: `${output}/step-${String(index + 1).padStart(2, '0')}.png`, fullPage: true })
    if (index + 1 < count) {
      await page.keyboard.press('ArrowRight')
      await page.locator(`[data-step-index="${index + 1}"]`).waitFor()
    }
  }
  if (errors.length) console.warn(`Advisory browser console/page errors: ${errors.join('; ')}`)
  console.log(`Captured ${count} settled step screenshots in ${output}`)
} finally {
  await browser?.close()
  server.kill('SIGTERM')
}
