import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { chromium } from 'playwright'

const run = (args) => new Promise((resolve, reject) => {
  const child = spawn(args[0], args.slice(1), { stdio: 'inherit' })
  child.on('exit', (code) => code === 0 ? resolve() : reject(new Error(`${args.join(' ')} exited ${code}`)))
})
let server
let browser
try {
  await run(['npm', 'run', 'build'])
  if (!existsSync(chromium.executablePath())) await run(['npx', 'playwright', 'install', 'chromium'])
  server = spawn(process.execPath, [resolve('node_modules/vite/bin/vite.js'), 'preview', '--host', '127.0.0.1', '--port', '4178', '--strictPort'], { stdio: 'ignore' })
  let ready = false
  for (let i = 0; i < 60; i++) {
    try { await fetch('http://127.0.0.1:4178/starter'); ready = true; break } catch { await delay(250) }
  }
  if (!ready) throw new Error('Preview did not become ready')
  browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
  await page.goto('http://127.0.0.1:4178/starter', { waitUntil: 'networkidle' })
  if (!(await page.locator('[data-presentation]').count())) {
    const body = await page.locator('body').innerText()
    throw new Error(`Presentation route did not render: ${body || '(empty page)'}. ${errors.join('; ')}`)
  }
  if (errors.length) throw new Error(`Browser errors: ${errors.join('; ')}`)
  console.log('Presentation build and first-step render passed.')
} catch (error) {
  console.error(`Verification failed: ${error.message}`)
  process.exitCode = 1
} finally {
  await browser?.close()
  server?.kill('SIGTERM')
}
