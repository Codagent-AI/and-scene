import { spawn } from 'node:child_process'
import { createServer } from 'node:net'
import { setTimeout as delay } from 'node:timers/promises'
import { join } from 'node:path'
import { chromium } from 'playwright'
import { validateCount } from './validation.mjs'

export const HOST = '127.0.0.1'
export const SETTLE_MS = 800
export function command(command, args, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, stdio: 'inherit' })
    child.on('error', reject)
    child.on('exit', code => code === 0 ? resolve() : reject(new Error(`${command} ${args.join(' ')} exited ${code}`)))
  })
}
async function freePort() {
  const server = createServer()
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, HOST, resolve) })
  const port = server.address().port
  await new Promise(resolve => server.close(resolve))
  return port
}
export async function withBrowser(root, callback, viewport = { width: 1440, height: 900 }) {
  const port = await freePort()
  const baseURL = `http://${HOST}:${port}`
  const server = spawn(process.execPath, [join(root, 'node_modules/vite/bin/vite.js'), 'preview', '--host', HOST, '--port', String(port), '--strictPort'], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] })
  // Subscribe at spawn time so cleanup cannot miss a signal exit.
  const exited = new Promise(resolve => { server.once('exit', resolve); server.once('error', resolve) })
  const isAlive = () => server.exitCode === null && server.signalCode === null
  let output = ''
  let spawnError
  server.on('error', error => { spawnError = error })
  server.stdout.on('data', chunk => { output += chunk })
  server.stderr.on('data', chunk => { output += chunk })
  let browser
  console.log(`preview: ${baseURL} pid=${server.pid}`)
  const stop = () => server.kill('SIGTERM')
  const onSignal = signal => {
    stop()
    process.exit(signal === 'SIGINT' ? 130 : 143)
  }
  const onTerm = () => onSignal('SIGTERM')
  const onInt = () => onSignal('SIGINT')
  process.once('SIGTERM', onTerm)
  process.once('SIGINT', onInt)
  try {
    let ready = false
    for (let i = 0; i < 150; i++) {
      if (spawnError || !isAlive()) throw new Error(`preview: ${spawnError ?? `exited (${server.signalCode ?? server.exitCode}): ${output}`}`)
      try { const response = await fetch(baseURL); if (response.ok) { ready = true; break } } catch { /* wait for preview */ }
      await delay(100)
    }
    if (!ready) throw new Error(`preview: readiness timeout at ${baseURL}: ${output}`)
    browser = await chromium.launch({ headless: true })
    const page = await browser.newPage({ viewport })
    page.setDefaultTimeout(5000)
    return await callback(page, baseURL)
  } finally {
    try { await browser?.close() } finally {
      if (!spawnError && isAlive()) {
        stop()
        const timer = setTimeout(() => server.kill('SIGKILL'), 3000)
        await exited
        clearTimeout(timer)
      }
      process.removeListener('SIGTERM', onTerm)
      process.removeListener('SIGINT', onInt)
      console.log(`preview: stopped pid=${server.pid}`)
    }
  }
}
export async function walkSteps(page, url, visit, settle = SETTLE_MS) {
  let active = 0
  const errors = []
  const onConsole = msg => { if (msg.type() === 'error') errors.push(msg.text()) }
  const onError = error => errors.push(error.message)
  page.on('console', onConsole)
  page.on('pageerror', onError)
  try {
    await page.goto(url, { waitUntil: 'networkidle' })
    const root = page.locator('[data-presentation]')
    await root.waitFor()
    // Verification visits reading chrome even when a presentation opens in live-delivery mode.
    if (await root.getAttribute('data-presentation-mode') === 'present') await page.keyboard.press('p')
    const count = validateCount(Number(await root.getAttribute('data-step-count')))
    for (active = 0; active < count; active++) {
      if (active > 0) await page.keyboard.press('ArrowRight')
      await page.waitForFunction(index => document.querySelector('[data-presentation]')?.getAttribute('data-step-index') === String(index), active)
      await page.waitForTimeout(settle)
      if (errors.length) throw new Error(errors.join('; '))
      await visit(page, active, count)
      if (errors.length) throw new Error(errors.join('; '))
      console.log(`render: step ${active} / ${count - 1} passed`)
    }
    if (errors.length) throw new Error(errors.join('; '))
  } catch (error) { throw new Error(`render: step ${active}: ${error.message}`, { cause: error }) }
  finally { page.off('console', onConsole); page.off('pageerror', onError) }
}
