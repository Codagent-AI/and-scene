import { spawn } from 'node:child_process'
import { mkdir } from 'node:fs/promises'
import { setTimeout as delay } from 'node:timers/promises'
import { chromium } from 'playwright'
import { captureSettledStep } from './inspection-diagnostics.mjs'

const slug = process.argv[2]
if (!slug) throw new Error('Usage: npm run inspect -- <presentation-slug>')
const port = Number(process.env.AND_SCENE_PREVIEW_PORT || 4174)
const settleMs = Number(process.env.AND_SCENE_SETTLE_MS || 700)
const output = `artifacts/inspection/${slug}`
await mkdir(output, { recursive: true })
const previewUrl = `http://127.0.0.1:${port}`
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { stdio: ['ignore', 'pipe', 'pipe'] })
let serverExit
let serverError
let serverOutput = ''
let serverStderr = ''
server.stdout.setEncoding('utf8').on('data', (chunk) => { serverOutput += chunk })
server.stderr.setEncoding('utf8').on('data', (chunk) => { serverStderr += chunk })
server.once('error', (error) => { serverError = error })
server.once('exit', (code, signal) => { serverExit = { code, signal } })
let browser
try {
  let ready = false
  for (let attempt = 0; attempt < 60; attempt++) {
    if (serverError) throw new Error(`Preview could not start: ${serverError.message}`)
    if (serverExit) throw new Error(`Preview exited early (port in use?): ${JSON.stringify(serverExit)}${serverStderr ? `; ${serverStderr.trim()}` : ''}`)
    if (serverOutput.includes(`${previewUrl}/`)) {
      try { if ((await fetch(`${previewUrl}/`)).ok) { ready = true; break } } catch {}
    }
    await delay(250)
  }
  if (!ready) throw new Error(`Preview did not become ready on 127.0.0.1:${port}; build the app first.${serverStderr ? ` ${serverStderr.trim()}` : ''}`)
  browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
  if (serverExit || serverError) throw new Error(`Preview stopped before browser navigation${serverStderr ? `; ${serverStderr.trim()}` : ''}`)
  const response = await page.goto(`${previewUrl}/${slug}`)
  if (!response?.ok()) throw new Error(`Presentation route /${slug} returned ${response?.status()}`)
  try { await page.locator('[data-step-count]').waitFor({ timeout: 5000 }) }
  catch { throw new Error(`Presentation route /${slug} did not render step navigation`) }
  const count = Number(await page.locator('[data-step-count]').getAttribute('data-step-count'))
  for (let index = 0; index < count; index++) {
    if (serverExit || serverError) throw new Error(`Preview stopped at step ${index + 1}${serverStderr ? `; ${serverStderr.trim()}` : ''}`)
    const warnings = await captureSettledStep(page, index + 1, `${output}/step-${String(index + 1).padStart(2, '0')}.png`, settleMs)
    for (const warning of warnings) console.warn(warning)
    if (index < count - 1) {
      await page.keyboard.press('ArrowRight')
      await page.waitForFunction((expected) => Number(document.querySelector('[data-step-index]')?.getAttribute('data-step-index')) === expected, index + 1)
    }
  }
  console.log(`Captured ${count} settled screenshots under ${output}`)
} finally {
  await browser?.close()
  if (server.exitCode === null) {
    const exited = new Promise((resolve) => server.once('exit', resolve))
    server.kill('SIGTERM')
    await Promise.race([exited, delay(2000)])
    if (server.exitCode === null) server.kill('SIGKILL')
  }
}
