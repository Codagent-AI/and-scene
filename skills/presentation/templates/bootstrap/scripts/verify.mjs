import { spawn } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'
import { chromium } from 'playwright'

const root = new URL('../', import.meta.url)
const run = (args) => new Promise((resolve, reject) => {
  const child = spawn('npm', args, { cwd: root, stdio: 'inherit' })
  child.on('error', reject)
  child.on('exit', (code) => code === 0 ? resolve() : reject(new Error(`npm ${args.join(' ')} failed (${code})`)))
})
let server
let browser
try {
  await run(['run', 'build'])
  server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', '4179', '--strictPort'], { cwd: root, stdio: 'ignore' })
  const url = 'http://127.0.0.1:4179/starter'
  let ready = false
  for (let i = 0; i < 60; i++) {
    try { ready = (await fetch(url)).ok; if (ready) break } catch {}
    await delay(250)
  }
  if (!ready) throw new Error('preview did not become ready at 127.0.0.1:4179')
  browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  const errors = []
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto(url, { waitUntil: 'networkidle' })
  if (!await page.locator('[data-step-count="1"][data-step-index="0"]').count()) throw new Error('starter route did not render step 1')
  if (errors.length) throw new Error(`browser errors: ${errors.join('; ')}`)
  console.log('PASS: bootstrap build and starter route render')
} catch (error) {
  console.error(`FAIL: ${error.message}`)
  process.exitCode = 1
} finally {
  await browser?.close()
  server?.kill('SIGTERM')
}
