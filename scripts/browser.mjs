import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { createServer } from 'node:net'
import { resolve } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { chromium } from 'playwright'

export const HOST = '127.0.0.1'
export const SETTLE_MS = 810
export async function command(program, args, cwd = process.cwd()) {
  const child = spawn(program, args, { cwd, stdio: 'inherit' })
  const [code] = await once(child, 'exit')
  if (code !== 0) throw new Error(`${program} ${args.join(' ')} exited ${code}`)
}
export async function preview(cwd = process.cwd()) {
  const probe = createServer()
  probe.listen(0, HOST)
  await once(probe, 'listening')
  const port = probe.address().port
  await new Promise(resolve => probe.close(resolve))
  const url = `http://${HOST}:${port}`
  const child = spawn(process.execPath, [resolve(cwd, 'node_modules/vite/bin/vite.js'), 'preview', '--host', HOST, '--port', String(port), '--strictPort'], { cwd, stdio: ['ignore', 'pipe', 'pipe'] })
  let output = ''
  child.stdout.on('data', chunk => { output += chunk })
  child.stderr.on('data', chunk => { output += chunk })
  let spawnError
  child.on('error', error => { spawnError = error })
  const stop = async () => {
    if (child.exitCode !== null || child.signalCode) return
    const exited = once(child, 'exit')
    child.kill('SIGTERM')
    const timer = setTimeout(() => child.kill('SIGKILL'), 2000)
    await exited
    clearTimeout(timer)
  }
  try {
    for (let i = 0; i < 100; i++) {
      if (spawnError || child.exitCode !== null) throw new Error(`preview failed: ${spawnError ?? output}`)
      try { if ((await fetch(url)).ok) return { url, port, stop } } catch { /* readiness retry */ }
      await delay(100)
    }
    throw new Error(`preview readiness timed out: ${output}`)
  } catch (error) { await stop(); throw error }
}
export async function withBrowser(cwd, callback, options = {}) {
  const server = await preview(cwd)
  let browser
  const abort = () => { void browser?.close(); void server.stop() }
  process.once('SIGINT', abort)
  process.once('SIGTERM', abort)
  try {
    browser = await chromium.launch({ headless: true })
    const page = await browser.newPage({ viewport: options.viewport ?? { width: 1440, height: 900 } })
    page.setDefaultTimeout(5000)
    console.log(`preview ${server.url}`)
    return await callback(page, server.url)
  } finally {
    try { await browser?.close() } finally { await server.stop() }
    process.removeListener('SIGINT', abort)
    process.removeListener('SIGTERM', abort)
    console.log(`preview stopped ${server.url}`)
  }
}
export async function stepCount(page) {
  const hook = page.locator('[data-presentation][data-step-count][data-step-index]')
  await hook.waitFor()
  const count = Number(await hook.getAttribute('data-step-count'))
  if (!Number.isInteger(count) || count < 1) throw new Error('invalid data-step-count')
  return { hook, count }
}
export async function visitSteps(page, count, hook, callback, settleMs = SETTLE_MS) {
  for (let index = 0; index < count; index++) {
    if (index) await page.keyboard.press('ArrowRight')
    await page.waitForFunction(expected => document.querySelector('[data-presentation]')?.getAttribute('data-step-index') === String(expected), index, { timeout: 3000 }).catch(() => { throw new Error(`step ${index}: transition did not advance`) })
    await page.waitForTimeout(settleMs)
    await callback(index)
    if (Number(await hook.getAttribute('data-step-index')) !== index) throw new Error(`step ${index}: inconsistent active index`)
  }
}
