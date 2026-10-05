import { spawn, spawnSync } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'
import { chromium } from 'playwright'

const port = Number(process.env.PORT ?? 4179)
const base = `http://127.0.0.1:${port}`
{
  const build = spawnSync('npm', ['run', 'build'], { stdio: 'inherit' })
  if (build.status !== 0) process.exit(build.status ?? 1)
}
const preview = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { stdio: 'inherit' })
let browser
try {
  let ready = false
  for (let i = 0; i < 60; i++) {
    try { if ((await fetch(base)).ok) { ready = true; break } } catch {}
    if (preview.exitCode !== null) throw new Error(`preview exited with ${preview.exitCode}`)
    await delay(250)
  }
  if (!ready) throw new Error('preview did not become ready')
  browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
  await page.goto(base, { waitUntil: 'networkidle' })
  if (await page.locator('[data-presentation-landing]').count() !== 1) throw new Error('landing route did not render')
  if (errors.length) throw new Error(`browser errors: ${errors.join('; ')}`)
  console.log('Bootstrap build and browser route smoke check passed.')
} catch (error) {
  console.error(`Bootstrap verification failed: ${error.message}`)
  process.exitCode = 1
} finally {
  await browser?.close()
  preview.kill('SIGTERM')
}
