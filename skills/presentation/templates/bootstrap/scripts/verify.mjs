import { spawn } from 'node:child_process'
import { chromium } from '@playwright/test'
import { startPreview } from './preview-server.mjs'

const run = (command, args) => new Promise((resolve, reject) => {
  const child = spawn(command, args, { stdio: 'inherit', shell: process.platform === 'win32' })
  child.on('error', reject)
  child.on('exit', (code) => code === 0 ? resolve() : reject(new Error(`${command} ${args.join(' ')} exited ${code}`)))
})

let preview
let browser
try {
  await run('npm', ['run', 'build'])
  preview = await startPreview(4178)
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
  await preview?.stop()
}
