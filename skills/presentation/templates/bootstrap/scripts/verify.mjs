import { spawn } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'
import { chromium } from 'playwright'

const host = '127.0.0.1'
const port = Number(process.env.PORT || 4178)
const route = process.argv[2] || '/sample'
const server = spawn('npm', ['run', 'preview', '--', '--host', host, '--port', String(port), '--strictPort'], { stdio: 'ignore' })
let browser
try {
  let ready = false
  for (let i = 0; i < 80; i++) {
    try { if ((await fetch(`http://${host}:${port}${route}`)).ok) { ready = true; break } } catch {}
    if (server.exitCode !== null) throw new Error(`Preview exited with ${server.exitCode}`)
    await delay(250)
  }
  if (!ready) throw new Error('Preview did not become ready')
  browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  const errors = []
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
  page.on('pageerror', error => errors.push(error.message))
  await page.goto(`http://${host}:${port}${route}`, { waitUntil: 'networkidle' })
  await page.locator('[data-step-index]').waitFor()
  if (errors.length) throw new Error(`Browser errors: ${errors.join('; ')}`)
  console.log(`PASS: ${route} rendered on ${host}`)
} catch (error) {
  console.error(`Render verification failed: ${error.message}`)
  process.exitCode = 1
} finally {
  await browser?.close()
  server.kill('SIGTERM')
}
