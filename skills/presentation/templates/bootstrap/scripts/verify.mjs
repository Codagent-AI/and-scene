import { spawn } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const project = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const run = (command, args) => new Promise((resolve, reject) => {
  const child = spawn(command, args, { stdio: 'inherit', shell: process.platform === 'win32' })
  child.once('error', reject)
  child.once('exit', (code) => code === 0 ? resolve() : reject(new Error(`${command} ${args.join(' ')} exited ${code}`)))
})
let server
let browser
try {
  await run('npm', ['--prefix', project, 'run', 'build'])
  server = spawn('npm', ['--prefix', project, 'run', 'preview', '--', '--host', '127.0.0.1', '--port', '4178', '--strictPort'], { stdio: 'ignore', shell: process.platform === 'win32' })
  const url = 'http://127.0.0.1:4178'
  let ready = false
  for (let i = 0; i < 60; i++) {
    try { if ((await fetch(url)).ok) { ready = true; break } } catch {}
    await delay(250)
  }
  if (!ready) throw new Error('render check: preview did not become ready at 127.0.0.1:4178')
  browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
  await page.goto(`${url}/starter`)
  try { await page.locator('[data-step-count]').waitFor({ timeout: 10000 }) } catch {
    throw new Error(`render check: route /starter did not mount a presentation${errors.length ? `: ${errors.join('; ')}` : ''}`)
  }
  const count = Number(await page.locator('[data-step-count]').getAttribute('data-step-count'))
  for (let index = 0; index < count; index++) {
    await page.waitForFunction((expected) => Number(document.querySelector('[data-step-index]')?.getAttribute('data-step-index')) === expected, index)
    if (errors.length) throw new Error(`render check at step ${index}: ${errors.join('; ')}`)
    if (index + 1 < count) { await page.keyboard.press('ArrowRight'); await page.waitForTimeout(800) }
  }
  console.log(`PASS: build and rendered ${count} step(s) on 127.0.0.1`)
} catch (error) {
  console.error(`FAIL: ${error.message}`)
  process.exitCode = 1
} finally {
  await browser?.close()
  server?.kill('SIGTERM')
}
