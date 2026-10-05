import { spawn } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'

const port = 4174
const base = `http://127.0.0.1:${port}`
const vite = fileURLToPath(new URL('../node_modules/vite/bin/vite.js', import.meta.url))
const server = spawn(process.execPath, [vite, 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { cwd: fileURLToPath(new URL('..', import.meta.url)), stdio: 'ignore' })
let browser
try {
  let ready = false
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try { ready = (await fetch(base)).ok; if (ready) break } catch { /* preview is starting */ }
    await delay(250)
  }
  if (!ready) throw new Error('Vite preview did not become ready on 127.0.0.1')
  browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  const errors = []
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto(`${base}/example`, { waitUntil: 'networkidle' })
  await page.locator('[data-presentation]').waitFor()
  await page.locator('[data-presentation-caption]').waitFor()
  if (errors.length) throw new Error(`Browser errors: ${errors.join('; ')}`)
  console.log('PASS: example route rendered in Chromium without browser errors')
} catch (error) {
  console.error(`FAIL: ${error instanceof Error ? error.message : error}`)
  process.exitCode = 1
} finally {
  await browser?.close()
  server.kill('SIGTERM')
  await new Promise((resolve) => server.once('close', resolve))
}
