import { spawn } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'
import { chromium } from 'playwright'

const host = '127.0.0.1'
const port = Number(process.env.PRESENTATION_PREVIEW_PORT ?? 4178)
const origin = `http://${host}:${port}`
let preview
let browser

function command(executable, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(executable, args, { stdio: 'inherit', ...options })
    child.once('error', reject)
    child.once('exit', (code) => code === 0 ? resolve() : reject(new Error(`${executable} exited with code ${code}`)))
  })
}

async function stop(child) {
  if (!child || child.exitCode !== null) return
  child.kill('SIGTERM')
  await Promise.race([new Promise((resolve) => child.once('exit', resolve)), delay(3000)])
  if (child.exitCode === null) child.kill('SIGKILL')
}

try {
  await command(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'build'])
  preview = spawn(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'preview', '--', '--host', host, '--port', String(port), '--strictPort'], { stdio: 'ignore' })
  let ready = false
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try { ready = (await fetch(origin)).ok; if (ready) break } catch {}
    await delay(250)
  }
  if (!ready) throw new Error(`preview did not become ready at ${origin}`)
  browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  let currentStep = 0
  page.on('console', (message) => { if (message.type() === 'error') throw new Error(`console error at step ${currentStep}: ${message.text()}`) })
  page.on('pageerror', (error) => { throw new Error(`page error at step ${currentStep}: ${error.message}`) })
  await page.goto(`${origin}/starter`)
  const count = Number(await page.locator('[data-step-count]').getAttribute('data-step-count'))
  if (!Number.isInteger(count) || count < 1) throw new Error('route did not expose a valid data-step-count')
  for (currentStep = 0; currentStep < count; currentStep += 1) {
    await page.waitForFunction((index) => Number(document.querySelector('[data-step-index]')?.getAttribute('data-step-index')) === index, currentStep)
    if (currentStep < count - 1) await page.keyboard.press('ArrowRight')
  }
  console.log(`PASS: build and rendered ${count} step(s) at ${origin}/starter`)
} catch (error) {
  console.error(`FAIL: ${error.message}`)
  process.exitCode = 1
} finally {
  await browser?.close()
  await stop(preview)
}
