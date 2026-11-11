import { spawn } from 'node:child_process'
import { createServer } from 'node:net'
import { once } from 'node:events'
import { resolve } from 'node:path'
import { chromium } from 'playwright'

export const HOST = '127.0.0.1'
export const DEFAULT_SETTLE_MS = 1000
export const delay = (ms) => new Promise((accept) => setTimeout(accept, ms))

export async function buildApp(cwd) {
  const child = spawn('npm', ['run', 'build'], { cwd, stdio: 'inherit' })
  const [code] = await once(child, 'exit')
  if (code !== 0) throw new Error(`build: npm run build exited ${code}`)
}

async function freePort() {
  const socket = createServer()
  socket.listen(0, HOST)
  await once(socket, 'listening')
  const port = socket.address().port
  await new Promise((accept, reject) => socket.close((error) => error ? reject(error) : accept()))
  return port
}

export async function withPreview(cwd, callback) {
  const port = await freePort()
  const origin = `http://${HOST}:${port}`
  const child = spawn(process.execPath, [resolve(cwd, 'node_modules/vite/bin/vite.js'), 'preview', '--host', HOST, '--port', String(port), '--strictPort'], { cwd, stdio: ['ignore', 'pipe', 'pipe'] })
  let serverOutput = ''
  let spawnError
  child.on('error', (error) => { spawnError = error })
  child.stdout.on('data', (chunk) => { serverOutput += chunk })
  child.stderr.on('data', (chunk) => { serverOutput += chunk })
  let browser
  let browserServer
  const stop = () => { child.kill('SIGTERM'); void browserServer?.close() }
  process.once('SIGTERM', stop)
  process.once('SIGINT', stop)
  try {
    let ready = false
    const deadline = Date.now() + 20_000
    while (Date.now() < deadline && child.exitCode === null && !spawnError) {
      try {
        const response = await fetch(origin, { signal: AbortSignal.timeout(500) })
        if (response.ok) { ready = true; break }
      } catch { /* The preview has not bound its socket yet. */ }
      await delay(100)
    }
    if (!ready) throw new Error(`preview: ${spawnError?.message || serverOutput || 'readiness timeout'}`)
    console.log(`preview: ${origin} (readiness ${origin}) pid=${child.pid}`)
    browserServer = await chromium.launchServer({ headless: true, host: HOST })
    const browserPid = browserServer.process().pid
    console.log(`browser: pid=${browserPid}`)
    browser = await chromium.connect(browserServer.wsEndpoint())
    return await callback({ browser, origin, browserPid })
  } finally {
    process.removeListener('SIGTERM', stop)
    process.removeListener('SIGINT', stop)
    try {
      await browser?.close()
    } finally {
      try {
        await browserServer?.close()
        if (browserServer) console.log(`cleanup: browser pid=${browserServer.process().pid} stopped connected=${browser?.isConnected() ?? false}`)
      } finally {
        if (child.exitCode === null) {
          const exited = once(child, 'exit')
          child.kill('SIGTERM')
          const force = setTimeout(() => child.kill('SIGKILL'), 3000)
          await exited
          clearTimeout(force)
        }
        console.log(`cleanup: preview pid=${child.pid} stopped`)
      }
    }
  }
}

export async function openPresentation(browser, origin, slug, viewport = { width: 1440, height: 900 }) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error('route: expected a registered lowercase presentation slug')
  const page = await browser.newPage({ viewport })
  const errors = []
  page.on('console', (message) => { if (message.type() === 'error') errors.push(`console.error: ${message.text()}`) })
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`))
  try {
    await page.goto(`${origin}/${slug}`, { waitUntil: 'networkidle' })
    await page.locator('[data-presentation][data-step-count]').waitFor({ timeout: 10_000 })
  } catch (error) {
    throw new Error(errors.length ? errors.join('; ') : error.message, { cause: error })
  }
  return { page, errors }
}

export async function advanceTo(page, index) {
  if (index > 0) {
    await page.keyboard.press('ArrowRight')
    try {
      await page.waitForFunction((expected) => Number(document.querySelector('[data-presentation]')?.getAttribute('data-step-index')) === expected, index, { timeout: 4000 })
    } catch {
      throw new Error(`transition step ${index}: data-step-index did not advance`)
    }
  }
  const actual = Number(await page.locator('[data-presentation]').getAttribute('data-step-index'))
  if (actual !== index) throw new Error(`transition step ${index}: observed index ${actual}`)
}
