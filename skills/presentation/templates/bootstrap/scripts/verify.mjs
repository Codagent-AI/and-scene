import { spawn } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'
import { chromium } from '@playwright/test'

const run = (command, args) => new Promise((resolve, reject) => {
  const child = spawn(command, args, { stdio: 'inherit', shell: process.platform === 'win32' })
  child.on('error', reject)
  child.on('exit', (code) => code === 0 ? resolve() : reject(new Error(`${command} ${args.join(' ')} exited ${code}`)))
})

let server
let browser
try {
  await run('npm', ['run', 'build'])
  server = spawn('npm', ['run', 'preview', '--', '--host', '127.0.0.1', '--port', '4178', '--strictPort'], { stdio: 'ignore' })
  let ready = false
  for (let i = 0; i < 50; i++) {
    try { ready = (await fetch('http://127.0.0.1:4178/')).ok; if (ready) break } catch {}
    await delay(200)
  }
  if (!ready) throw new Error('Preview did not become ready at http://127.0.0.1:4178')
  browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  const errors = []
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('http://127.0.0.1:4178/starter', { waitUntil: 'networkidle' })
  if (!(await page.locator('[data-step-count]').count())) throw new Error('Registered starter route did not render presentation step hooks')
  if (errors.length) throw new Error(`Browser render failed: ${errors.join('; ')}`)
  console.log('PASS: build and starter route render')
} catch (error) {
  console.error(`FAIL: ${error.message}`)
  process.exitCode = 1
} finally {
  await browser?.close()
  server?.kill('SIGTERM')
}
