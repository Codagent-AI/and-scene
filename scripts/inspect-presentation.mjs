import { mkdir } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import { createServer } from 'node:net'
import { fileURLToPath } from 'node:url'
import { setTimeout as delay } from 'node:timers/promises'
import { chromium } from 'playwright'
import { inspectVisiblePresentation } from './inspection-diagnostics.mjs'

const slug = process.argv[2]
if (!slug) { console.error('Usage: npm run inspect -- <presentation-slug>'); process.exit(2) }
const host = '127.0.0.1'
const settleMs = Number(process.env.PRESENTATION_SETTLE_MS ?? 900)
const width = Number(process.env.PRESENTATION_VIEWPORT_WIDTH ?? 1440)
const height = Number(process.env.PRESENTATION_VIEWPORT_HEIGHT ?? 900)
const portServer = createServer()
await new Promise((resolve, reject) => portServer.once('error', reject).listen(0, host, resolve))
const port = portServer.address().port
await new Promise((resolve, reject) => portServer.close((error) => error ? reject(error) : resolve()))
const origin = `http://${host}:${port}/${slug}`
const vite = fileURLToPath(new URL('../node_modules/vite/bin/vite.js', import.meta.url))
const server = spawn(process.execPath, [vite, 'preview', '--host', host, '--port', String(port), '--strictPort'], { stdio: ['ignore', 'pipe', 'pipe'] })
let serverOutput = ''
server.stdout.on('data', (chunk) => { serverOutput += chunk })
server.stderr.on('data', (chunk) => { serverOutput += chunk })
let browser
try {
  let ready = false
  for (let attempt = 0; attempt < 60; attempt += 1) {
    if (server.exitCode !== null) throw new Error(`preview exited ${server.exitCode}: ${serverOutput}`)
    try { if ((await fetch(origin)).ok) { ready = true; break } } catch { /* preview is starting */ }
    await delay(200)
  }
  if (!ready) throw new Error(`preview did not become ready at ${origin}; run npm run build first\n${serverOutput}`)
  browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width, height } })
  await page.goto(origin, { waitUntil: 'networkidle' })
  const root = page.locator('[data-presentation-root]')
  await root.waitFor()
  const count = Number(await root.getAttribute('data-step-count'))
  if (!Number.isInteger(count) || count < 1) throw new Error('presentation did not expose a valid data-step-count')
  const output = `artifacts/presentation-inspection/${slug}`
  await mkdir(output, { recursive: true })
  for (let index = 0; index < count; index += 1) {
    if (index > 0) {
      await page.keyboard.press('ArrowRight')
      await page.waitForFunction((expected) => Number(document.querySelector('[data-presentation-root]')?.getAttribute('data-step-index')) === expected, index)
    }
    await page.waitForTimeout(settleMs)
    const diagnostics = await page.evaluate(inspectVisiblePresentation)
    await page.screenshot({ path: `${output}/step-${String(index + 1).padStart(2, '0')}.png`, fullPage: true })
    for (const warning of diagnostics) console.warn(`WARN step ${index + 1}: ${warning}`)
    console.log(`Captured step ${index + 1}/${count} after ${settleMs}ms in ${output}`)
  }
  console.log(`Inspection complete: ${count} screenshots at ${width}x${height}`)
} catch (error) {
  console.error(`FAIL: ${error.message}`)
  process.exitCode = 1
} finally {
  await browser?.close()
  server.kill('SIGTERM')
  await Promise.race([new Promise((resolve) => server.once('exit', resolve)), delay(1500)]).catch(() => {})
  if (server.exitCode === null) server.kill('SIGKILL')
}
