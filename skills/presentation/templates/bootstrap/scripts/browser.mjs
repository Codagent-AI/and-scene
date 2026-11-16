import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { createServer } from 'node:net'
import { setTimeout as delay } from 'node:timers/promises'
import { chromium } from 'playwright'

export const HOST = '127.0.0.1'
export const DEFAULT_SETTLE_MS = 1000
export function parseOptions(args) {
  const result = { slug: undefined, first: false, settle: DEFAULT_SETTLE_MS, width: 1440, height: 900 }
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (arg === '--first') result.first = true
    else if (arg === '--slug') {
      result.slug = args[++i]
      if (!result.slug) throw new Error('Missing --slug value')
    }
    else if (['--settle', '--width', '--height'].includes(arg)) {
      const key = arg.slice(2), value = Number(args[++i])
      if (!Number.isFinite(value) || value < (key === 'settle' ? 0 : 1)) throw new Error(`Invalid ${arg}`)
      result[key] = value
    } else if (!arg.startsWith('-') && !result.slug) result.slug = arg
    else throw new Error(`Unknown argument: ${arg}`)
  }
  if (result.slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(result.slug)) throw new Error('Invalid presentation slug')
  return result
}
export function command(executable, args, cwd = process.cwd()) {
  return new Promise((resolve, reject) => {
    const child = spawn(executable, args, { cwd, stdio: 'inherit' })
    child.on('error', reject)
    child.on('exit', code => code === 0 ? resolve() : reject(new Error(`${executable} ${args.join(' ')} failed (${code})`)))
  })
}
async function freePort() {
  const server = createServer()
  server.listen(0, HOST)
  await once(server, 'listening')
  const port = server.address().port
  await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()))
  return port
}
export async function withPreview(run, { width = 1440, height = 900 } = {}) {
  const port = await freePort()
  const url = `http://${HOST}:${port}`
  const controller = new AbortController()
  const signal = controller.signal
  const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', HOST, '--port', String(port), '--strictPort'], { detached: true, stdio: ['ignore', 'pipe', 'pipe'] })
  let serverError = ''
  server.stderr.on('data', chunk => { serverError += chunk })
  server.stdout.resume()
  const serverExit = new Promise(resolve => {
    server.once('exit', resolve)
    server.once('error', error => { controller.abort(error); resolve() })
  })
  let browser
  let browserServer
  const shutdown = () => {
    if (!server.pid) return
    try { process.kill(-server.pid, 'SIGTERM') } catch (error) { if (error.code !== 'ESRCH') throw error }
  }
  const onTerm = () => controller.abort(new Error('Interrupted by SIGTERM'))
  const onInt = () => controller.abort(new Error('Interrupted by SIGINT'))
  process.once('SIGTERM', onTerm)
  process.once('SIGINT', onInt)
  let onAbort
  try {
    let ready = false
    for (let attempt = 0; attempt < 100; attempt++) {
      signal.throwIfAborted()
      if (server.exitCode !== null) throw new Error(`Preview exited: ${serverError}`)
      try { ready = (await fetch(url, { signal })).ok } catch { signal.throwIfAborted() /* Otherwise preview is not listening yet. */ }
      if (ready) break
      await delay(100, undefined, { signal })
    }
    signal.throwIfAborted()
    if (!ready) throw new Error(`Preview readiness failed: ${url} ${serverError}`)
    console.log(`preview ready ${url} pid=${server.pid}; probe=${url}`)
    browserServer = await chromium.launchServer({ headless: true, host: HOST, handleSIGINT: false, handleSIGTERM: false })
    console.log(`chromium started pid=${browserServer.process().pid}`)
    signal.throwIfAborted()
    browser = await chromium.connect(browserServer.wsEndpoint())
    signal.throwIfAborted()
    const page = await browser.newPage({ viewport: { width, height } })
    signal.throwIfAborted()
    console.log(`browser viewport ${width}x${height}`)
    const interrupted = new Promise((_, reject) => {
      onAbort = () => reject(signal.reason)
      signal.addEventListener('abort', onAbort, { once: true })
    })
    return await Promise.race([Promise.resolve().then(() => run(page, url)), interrupted])
  } catch (error) {
    throw signal.aborted ? signal.reason : error
  } finally {
    if (onAbort) signal.removeEventListener('abort', onAbort)
    try {
      try { await browser?.close() } finally {
        if (browserServer) {
          await browserServer.close()
          console.log(`chromium stopped pid=${browserServer.process().pid}`)
        }
      }
    } finally {
      try { shutdown(); await serverExit } finally {
        process.removeListener('SIGTERM', onTerm)
        process.removeListener('SIGINT', onInt)
      }
      console.log(`preview stopped pid=${server.pid}`)
    }
  }
}
export async function visitSteps(page, url, slug, { first = false, settle = DEFAULT_SETTLE_MS, expected, capture } = {}) {
  let index = 0
  const errors = []
  page.on('console', msg => { if (msg.type() === 'error') errors.push(`console: ${msg.text()}`) })
  page.on('pageerror', error => errors.push(`pageerror: ${error.message}`))
  const assertClean = () => { if (errors.length) throw new Error(`step ${index}: ${errors.join('; ')}`) }
  try {
    console.log(`browser URL ${url}/${slug}`)
    await page.goto(`${url}/${slug}`)
    const root = page.locator('[data-presentation-root]')
    await root.waitFor({ timeout: 8000 })
    const count = Number(await root.getAttribute('data-step-count'))
    if (!Number.isInteger(count) || count < 1) throw new Error('invalid data-step-count')
    if (expected && count !== expected.length) throw new Error(`reference step count ${count}, expected ${expected.length}`)
    for (index = 0; index < (first ? 1 : count); index++) {
      await page.waitForFunction(i => document.querySelector('[data-presentation-root]')?.getAttribute('data-step-index') === String(i), index, { timeout: 3000 })
      await page.waitForTimeout(settle)
      assertClean()
      if (expected) {
        const title = await page.locator('[data-presentation-title]').innerText()
        const caption = await page.locator('[data-presentation-caption]').innerText()
        const marker = (await page.locator('[data-presentation-marker]').textContent()).trim()
        if (title !== expected[index].title || caption !== expected[index].caption || !marker.endsWith(expected[index].era)) throw new Error('reference narration/order mismatch')
      }
      console.log(`step ${index} rendered`)
      await capture?.(index)
      if (index + 1 < (first ? 1 : count)) {
        // Keep fault attribution on the destination while the transition is pending.
        index++
        await page.keyboard.press('ArrowRight')
        await page.waitForFunction(i => document.querySelector('[data-presentation-root]')?.getAttribute('data-step-index') === String(i), index, { timeout: 3000 })
        index--
      }
    }
    index = Math.min(index, count - 1)
    assertClean()
    return count
  } catch (error) {
    const details = [...new Set([...errors, error.message])]
    throw new Error(`step ${index}: ${details.join('; ')}`, { cause: error })
  }
}
