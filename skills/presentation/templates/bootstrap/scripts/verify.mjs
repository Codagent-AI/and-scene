import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { setTimeout as delay } from 'node:timers/promises'
import { chromium } from 'playwright'

const host = '127.0.0.1'
const port = 4173
const origin = `http://${host}:${port}`
const build = spawn('npm', ['run', 'build'], { stdio: 'inherit', shell: process.platform === 'win32' })
const buildCode = await new Promise((resolve) => build.on('exit', resolve))
if (buildCode !== 0) throw new Error(`Build failed with exit code ${buildCode}`)
const vite = fileURLToPath(new URL('../node_modules/vite/bin/vite.js', import.meta.url))
const server = spawn(process.execPath, [vite, 'preview', '--host', host, '--port', String(port), '--strictPort'], { stdio: 'ignore' })
let browser
try {
  let ready = false
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try { if ((await fetch(origin)).ok) { ready = true; break } } catch {}
    await delay(200)
  }
  if (!ready) throw new Error(`Preview did not become ready at ${origin}`)
  browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
  await page.goto(`${origin}/starter`, { waitUntil: 'networkidle' })
  await page.locator('[data-presentation-root]').waitFor()
  if (errors.length) throw new Error(`Route smoke check failed: ${errors.join('; ')}`)
  console.log('PASS: build and presentation index route rendered cleanly')
} catch (error) {
  console.error(`FAIL: ${error.message}`)
  process.exitCode = 1
} finally {
  await browser?.close()
  server.kill('SIGTERM')
}
