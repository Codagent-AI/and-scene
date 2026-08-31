import { spawn } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'
import { chromium } from 'playwright'

const slug = process.argv[2]
const host = '127.0.0.1'
const port = 4173
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm'

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'inherit' })
    child.on('error', reject)
    child.on('exit', (code) => code === 0 ? resolve() : reject(new Error(`${command} ${args.join(' ')} exited ${code}`)))
  })
}

function waitForExit(child) {
  if (child.exitCode !== null || child.signalCode !== null) return Promise.resolve()
  return new Promise((resolve) => child.once('close', resolve))
}

async function terminatePreview(preview) {
  if (!preview.pid) return
  if (process.platform === 'win32') {
    const taskkill = spawn('taskkill', ['/pid', String(preview.pid), '/T', '/F'], { stdio: 'ignore' })
    await new Promise((resolve) => taskkill.once('close', resolve))
  } else {
    try {
      process.kill(-preview.pid, 'SIGTERM')
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error && error.code !== 'ESRCH') throw error
    }
  }
  await waitForExit(preview)
}

async function waitForStep(page, index) {
  const chrome = page.locator(`[data-step-index="${index}"]`)
  await chrome.waitFor({ state: 'attached' })
  await delay(50)
}

function assertNoBrowserErrors(errors, stepIndex) {
  if (errors.length) throw new Error(`Browser error at step ${stepIndex}: ${errors.join('; ')}`)
}

async function waitForPreview(url) {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      if ((await fetch(url, { signal: AbortSignal.timeout(500) })).ok) return
    } catch { /* preview is still starting */ }
    await delay(100)
  }
  throw new Error(`Preview did not become ready at ${url}`)
}

if (!slug) throw new Error('Usage: npm run verify -- <presentation-slug>')

await run(npmCommand, ['run', 'build'])
const preview = spawn(npmCommand, ['run', 'preview', '--', '--host', host, '--port', String(port), '--strictPort'], { detached: process.platform !== 'win32', stdio: 'ignore' })
let browser

try {
  const url = `http://${host}:${port}/${slug}`
  await waitForPreview(url)
  browser = await chromium.launch()
  const page = await browser.newPage()
  const errors = []
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto(url, { waitUntil: 'networkidle' })
  const chrome = page.locator('[data-step-count][data-step-index]')
  const count = Number(await chrome.getAttribute('data-step-count'))
  if (!Number.isInteger(count) || count < 1) throw new Error(`No renderable steps found at ${url}`)
  for (let index = 0; index < count; index += 1) {
    await waitForStep(page, index)
    if (Number(await chrome.getAttribute('data-step-index')) !== index) throw new Error(`Step transition failed at step ${index}`)
    assertNoBrowserErrors(errors, index)
    if (index < count - 1) {
      await page.keyboard.press('ArrowRight')
      await waitForStep(page, index + 1)
    }
  }
  assertNoBrowserErrors(errors, count - 1)
  console.log(`PASS: ${slug} rendered ${count} steps on ${host}`)
} catch (error) {
  console.error(`FAIL: ${error instanceof Error ? error.message : String(error)}`)
  process.exitCode = 1
} finally {
  await browser?.close()
  await terminatePreview(preview)
}
