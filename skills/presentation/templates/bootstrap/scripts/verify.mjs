import { spawn, spawnSync } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'
import { chromium } from 'playwright'

const host = '127.0.0.1'
const port = Number(process.env.PREVIEW_PORT ?? 4178)
const route = process.env.PRESENTATION_ROUTE ?? '/'
const build = spawnSync('npm', ['run', 'build'], { stdio: 'inherit' })
if (build.status !== 0) {
  console.error('FAIL: presentation verification build phase')
  process.exit(build.status ?? 1)
}
const preview = spawn('npm', ['run', 'preview', '--', '--host', host, '--port', String(port), '--strictPort'], { stdio: 'ignore' })
let browser
try {
  const url = `http://${host}:${port}${route}`
  let ready = false
  for (let attempt = 0; attempt < 80; attempt += 1) {
    if (preview.exitCode !== null) throw new Error('vite preview exited before becoming ready')
    try { const response = await fetch(url); if (response.ok) { ready = true; break } } catch {}
    await delay(250)
  }
  if (!ready) throw new Error(`preview did not become ready at ${url}`)
  browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
  await page.goto(url, { waitUntil: 'networkidle' })
  await page.waitForTimeout(700)
  const presentation = await page.locator('[data-presentation]').count()
  if (route !== '/' && presentation !== 1) throw new Error(`route ${route} did not render a presentation`)
  if (errors.length) throw new Error(`browser render failed: ${errors.join('; ')}`)
  console.log(`PASS: build and browser route smoke check (${url})`)
} catch (error) {
  console.error(`FAIL: presentation verification: ${error.message}`)
  process.exitCode = 1
} finally {
  await browser?.close()
  preview.kill('SIGTERM')
}
