import { spawn } from 'node:child_process'
import { createServer } from 'node:net'
import { once } from 'node:events'
import { resolve } from 'node:path'
import { chromium } from 'playwright'
export const HOST = '127.0.0.1'
export const SETTLE_MS = 850
export async function command(command, args, cwd = process.cwd()) {
  const child = spawn(command, args, { cwd, stdio: 'inherit' })
  const [code] = await once(child, 'exit')
  if (code !== 0) throw new Error(`${command} ${args.join(' ')} exited ${code}`)
}
export async function preview(cwd = process.cwd()) {
  const reservation = createServer()
  reservation.listen(0, HOST)
  await once(reservation, 'listening')
  const port = reservation.address().port
  await new Promise((done, reject) => reservation.close(error => error ? reject(error) : done()))
  const origin = `http://${HOST}:${port}`
  const child = spawn(process.execPath, [resolve(cwd, 'node_modules/vite/bin/vite.js'), 'preview', '--host', HOST, '--port', String(port), '--strictPort'], { cwd, stdio: ['ignore', 'pipe', 'pipe'] })
  let output = '', spawnError
  child.on('error', error => { spawnError = error })
  child.stdout.on('data', data => { output += data })
  child.stderr.on('data', data => { output += data })
  const stop = async () => {
    if (child.exitCode !== null || child.signalCode !== null) return
    child.kill('SIGTERM')
    const forced = setTimeout(() => child.kill('SIGKILL'), 2000)
    try { await once(child, 'exit') } finally { clearTimeout(forced) }
  }
  try {
    for (let attempt = 0; attempt < 100; attempt++) {
      if (spawnError || child.exitCode !== null) throw new Error(`Preview failed: ${spawnError ?? output}`)
      try { if ((await fetch(origin)).ok) return { origin, stop, pid: child.pid } } catch { /* Await readiness. */ }
      await new Promise(done => setTimeout(done, 100))
    }
    throw new Error(`Preview readiness timed out at ${origin}: ${output}`)
  } catch (error) { await stop(); throw error }
}
export async function withBrowser(cwd, work, options = {}) {
  const server = await preview(cwd)
  let browser
  const signal = () => { void server.stop().finally(() => process.exit(1)) }
  process.once('SIGINT', signal); process.once('SIGTERM', signal)
  try {
    console.log(`Preview ${server.origin} (pid ${server.pid})`)
    browser = await chromium.launch({ headless: true })
    const page = await browser.newPage({ viewport: options.viewport ?? { width: 1440, height: 900 } })
    page.setDefaultTimeout(5000)
    return await work(page, server.origin)
  } finally {
    try { await browser?.close() } finally {
      await server.stop()
      process.removeListener('SIGINT', signal); process.removeListener('SIGTERM', signal)
      console.log(`Preview stopped (pid ${server.pid})`)
    }
  }
}
export function watchErrors(page) {
  const errors = []
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
  page.on('pageerror', error => errors.push(error.message))
  return errors
}
export async function settleStep(page, index, interval = SETTLE_MS) {
  await page.locator('[data-presentation-root]').waitFor()
  await page.waitForFunction(i => document.querySelector('[data-presentation-root]')?.getAttribute('data-step-index') === String(i), index)
  await page.waitForTimeout(interval)
}
export function browserFailure(index, errors) { return new Error(`render step ${index}: ${errors.join('; ')}`) }
