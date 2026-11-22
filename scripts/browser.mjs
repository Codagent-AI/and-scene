import { spawn, spawnSync } from 'node:child_process'
import { createServer } from 'node:net'
import { once } from 'node:events'
import { chromium } from 'playwright'
export const HOST = '127.0.0.1'
export const SETTLE_MS = 800
export function build() {
  const result = spawnSync('npm', ['run', 'build'], { stdio: 'inherit', timeout: 180000 })
  if (result.error || result.status !== 0) throw new Error('build: npm run build failed')
}
export async function withBrowser(run, { viewport = { width: 1440, height: 900 } } = {}) {
  const reservation = createServer()
  reservation.listen(0, HOST)
  await once(reservation, 'listening')
  const port = reservation.address().port
  await new Promise(resolve => reservation.close(resolve))
  const base = `http://${HOST}:${port}`
  const preview = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', HOST, '--port', String(port), '--strictPort'], { stdio: ['ignore', 'pipe', 'pipe'] })
  let serverError
  preview.on('error', error => { serverError = error })
  let browserServer
  const stop = async () => {
    if (browserServer) await browserServer.close()
    if (preview.exitCode === null && preview.signalCode === null) {
      preview.kill('SIGTERM')
      await Promise.race([once(preview, 'exit'), new Promise(resolve => setTimeout(resolve, 3000))])
      if (preview.exitCode === null && preview.signalCode === null) preview.kill('SIGKILL')
    }
  }
  const signal = () => { void stop().finally(() => process.exit(130)) }
  process.once('SIGINT', signal)
  process.once('SIGTERM', signal)
  try {
    let ready = false
    for (let attempt = 0; attempt < 100; attempt++) {
      if (serverError || preview.exitCode !== null) throw new Error(`preview: failed to start ${serverError || ''}`)
      try { if ((await fetch(base)).ok) { ready = true; break } } catch { /* preview still starting */ }
      await new Promise(resolve => setTimeout(resolve, 50))
    }
    if (!ready) throw new Error('preview: readiness timeout')
    console.log(`preview ${base} pid=${preview.pid}`)
    browserServer = await chromium.launchServer({ headless: true })
    console.log(`chromium pid=${browserServer.process().pid}`)
    const browser = await chromium.connect(browserServer.wsEndpoint())
    const page = await browser.newPage({ viewport })
    page.setDefaultTimeout(5000)
    return await run(page, base)
  } finally {
    await stop()
    process.removeListener('SIGINT', signal)
    process.removeListener('SIGTERM', signal)
    console.log('cleanup: browser and preview stopped')
  }
}
export async function visitSteps(page, url, visit, { mode } = {}) {
  let index = 0
  const errors = []
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()) })
  page.on('pageerror', error => errors.push(error.message))
  try {
    await page.goto(url)
    const host = page.locator('[data-presentation]')
    await host.waitFor()
    const count = Number(await host.getAttribute('data-step-count'))
    if (!Number.isInteger(count) || count < 1) throw new Error('invalid data-step-count')
    const initialMode = await host.getAttribute('data-presentation-mode')
    if (mode && initialMode !== mode) {
      // Verify the declared starting mode before revealing narration for metadata checks.
      await page.waitForTimeout(SETTLE_MS)
      if (errors.length) throw new Error(errors.join('; '))
      console.log(`initial mode ${initialMode}: pass`)
      await page.keyboard.press('p')
      await page.waitForFunction(expected => document.querySelector('[data-presentation]')?.getAttribute('data-presentation-mode') === expected, mode)
    }
    for (index = 0; index < count; index++) {
      if (index) {
        await page.keyboard.press('ArrowRight')
        await page.waitForFunction(i => document.querySelector('[data-presentation]')?.getAttribute('data-step-index') === String(i), index)
      }
      await page.waitForTimeout(SETTLE_MS)
      if (errors.length) throw new Error(errors.join('; '))
      await visit({ page, index, count, host })
      console.log(`render step ${index}: pass`)
    }
  } catch (error) { throw new Error(`render step ${index}: ${errors.length ? errors.join('; ') : error.message}`, { cause: error }) }
}
