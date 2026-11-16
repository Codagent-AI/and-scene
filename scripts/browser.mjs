import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { createServer } from 'node:net'
import { resolve } from 'node:path'
import { chromium } from 'playwright'
export const SETTLE_MS = 850
export async function freePort() {
  const server = createServer()
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  const port = server.address().port
  await new Promise(resolve => server.close(resolve))
  return port
}
export async function withPreview(work, { cwd = process.cwd(), viewport = { width: 1440, height: 900 } } = {}) {
  const port = await freePort()
  const origin = `http://127.0.0.1:${port}`
  const server = spawn(process.execPath, [resolve(cwd, 'node_modules/vite/bin/vite.js'), 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { cwd, stdio: ['ignore', 'pipe', 'pipe'] })
  let launchError
  let terminated = false
  // Subscribe before readiness/work: exitCode stays null after a signal exit.
  const exited = new Promise(resolve => {
    server.once('exit', () => { terminated = true; resolve() })
    server.once('error', error => { launchError = error; terminated = true; resolve() })
  })
  let output = ''
  server.stdout.on('data', d => { output += d })
  server.stderr.on('data', d => { output += d })
  let browser
  try {
    console.log(`preview: ${origin} pid=${server.pid}`)
    const deadline = Date.now() + 15000
    while (true) {
      if (terminated || server.exitCode !== null || server.signalCode != null) throw new Error(`preview: startup failed ${launchError ?? server.signalCode ?? server.exitCode ?? output}`)
      try { if ((await fetch(origin)).ok) break } catch { /* Wait for Vite readiness. */ }
      if (Date.now() >= deadline) throw new Error(`preview: readiness timeout at ${origin}: ${output}`)
      await new Promise(r => setTimeout(r, 80))
    }
    browser = await chromium.launch({ headless: true })
    const page = await browser.newPage({ viewport })
    return await work({ page, origin })
  } finally {
    try { await browser?.close() } finally {
      if (!terminated && server.exitCode === null && server.signalCode == null) {
        server.kill('SIGTERM')
        const timer = setTimeout(() => server.kill('SIGKILL'), 2000)
        try { await exited } finally { clearTimeout(timer) }
      }
      console.log(`preview: cleaned ${origin}`)
    }
  }
}
export function watchErrors(page) {
  const errors = []
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()) })
  page.on('pageerror', error => errors.push(error.message))
  return errors
}
export function assertClean(errors, index) {
  if (errors.length) throw new Error(`render: step ${index}: ${errors.join('; ')}`)
}
export async function visitSteps(page, slug, origin, { errors = [], capture = async () => {}, settle = SETTLE_MS, expectedCount } = {}) {
  let index = 0
  try {
    await page.goto(`${origin}/${encodeURIComponent(slug)}`)
    const root = page.locator('[data-presentation]')
    await root.waitFor({ timeout: 5000 })
    const count = Number(await root.getAttribute('data-step-count'))
    if (!Number.isInteger(count) || count < 1 || (expectedCount && count !== expectedCount)) throw new Error(`invalid step count ${count}`)
    for (index = 0; index < count; index++) {
      if (index) await page.keyboard.press('ArrowRight')
      try { await page.waitForFunction(i => document.querySelector('[data-presentation]')?.getAttribute('data-step-index') === String(i), index, { timeout: 3000 }) }
      catch { throw new Error(`transition: step ${index} did not advance`) }
      const transitionObservedAt = await page.evaluate(() => performance.now())
      await page.waitForTimeout(settle)
      assertClean(errors, index)
      await capture(index, count, { transitionObservedAt })
      console.log(`render: step ${index} / ${count} OK`)
    }
    return count
  } catch (error) {
    assertClean(errors, index)
    throw new Error(`render: step ${index}: ${error.message}`, { cause: error })
  }
}
