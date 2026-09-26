import { mkdir } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import { createServer } from 'node:net'
import { fileURLToPath } from 'node:url'
import { setTimeout as delay } from 'node:timers/promises'
import { chromium } from 'playwright'

const slug = process.argv[2]
if (!slug) throw new Error('Usage: npm run inspect -- <presentation-slug>')
const host = '127.0.0.1'
const getPort = async () => {
  const probe = createServer()
  await new Promise((resolve, reject) => probe.once('error', reject).listen(0, host, resolve))
  const { port } = probe.address()
  await new Promise((resolve, reject) => probe.close((error) => error ? reject(error) : resolve()))
  return port
}
const port = await getPort()
const origin = `http://${host}:${port}/${slug}`
const vite = fileURLToPath(new URL('../node_modules/vite/bin/vite.js', import.meta.url))
const server = spawn(process.execPath, [vite, 'preview', '--host', host, '--port', String(port), '--strictPort'], { stdio: ['ignore', 'pipe', 'pipe'] })
let serverFailure
let serverOutput = ''
server.stdout.on('data', (chunk) => { serverOutput += chunk })
server.stderr.on('data', (chunk) => { serverOutput += chunk })
server.once('error', (error) => { serverFailure = new Error(`Preview failed to start: ${error.message}`) })
server.once('exit', (code, signal) => {
  if (!server.killed) serverFailure = new Error(`Preview exited before inspection completed (code ${code}, signal ${signal})`)
})
const assertServerRunning = () => {
  if (serverFailure) throw new Error(`${serverFailure.message}\n${serverOutput}`)
  if (server.exitCode !== null) throw new Error(`Preview exited with code ${server.exitCode}\n${serverOutput}`)
}

let browser
try {
  let ready = false
  for (let attempt = 0; attempt < 50; attempt += 1) {
    assertServerRunning()
    try {
      const response = await fetch(origin)
      assertServerRunning()
      if (response.ok) { ready = true; break }
    } catch (error) {
      assertServerRunning()
      if (attempt === 49) throw error
    }
    await delay(200)
  }
  assertServerRunning()
  if (!ready) throw new Error(`Preview did not become ready at ${origin}; run npm run build first\n${serverOutput}`)

  browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
  await page.goto(origin, { waitUntil: 'networkidle' })
  await page.locator('[data-presentation-root]').waitFor()
  assertServerRunning()
  if (errors.length) throw new Error(`Presentation route ${slug} rendered with browser errors: ${errors.join('; ')}`)
  const count = Number(await page.locator('[data-presentation-root]').getAttribute('data-step-count'))
  if (!Number.isInteger(count) || count < 1) throw new Error('Presentation did not expose a valid data-step-count')
  const output = `artifacts/presentation-inspection/${slug}`
  await mkdir(output, { recursive: true })
  for (let index = 0; index < count; index += 1) {
    assertServerRunning()
    await page.waitForTimeout(1000)
    await page.screenshot({ path: `${output}/step-${String(index + 1).padStart(2, '0')}.png`, fullPage: true })
    if (index + 1 < count) {
      await page.keyboard.press('ArrowRight')
      await page.locator(`[data-step-index="${index + 1}"]`).waitFor()
    }
  }
  if (errors.length) throw new Error(`Presentation route ${slug} emitted browser errors: ${errors.join('; ')}`)
  console.log(`Captured ${count} settled step screenshots in ${output}`)
} catch (error) {
  console.error(`FAIL: ${error.message}`)
  process.exitCode = 1
} finally {
  await browser?.close()
  server.kill('SIGTERM')
}
