import { spawn } from 'node:child_process'
import { createServer } from 'node:net'
import { readFile } from 'node:fs/promises'
import { setTimeout as delay } from 'node:timers/promises'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { chromium } from 'playwright'

export function parseArgs(argv) {
  const args = { port: undefined, skipBuild: false }
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--port') {
      const port = Number(argv[++i])
      if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid --port; expected an integer from 1 to 65535')
      args.port = port
    } else if (argv[i] === '--skip-build') args.skipBuild = true
    else throw new Error(`Unknown argument: ${argv[i]}`)
  }
  return args
}

export function compareOutline(expected, actual) {
  if (actual.length !== expected.length) return `expected ${expected.length} steps, found ${actual.length}`
  for (let i = 0; i < expected.length; i += 1) {
    for (const field of ['era', 'title', 'caption']) {
      if (actual[i]?.[field] !== expected[i][field]) return `step ${i}: ${field} expected ${JSON.stringify(expected[i][field])}, found ${JSON.stringify(actual[i]?.[field])}`
    }
  }
  return undefined
}

export function parsePresentationRoutes(registry) {
  const routes = [...registry.matchAll(/["']?slug["']?\s*:\s*["']([^"']+)["']/g)].map(match => ({ slug: match[1] }))
  if (routes.length === 0) throw Error('no presentation slugs found in src/presentations/index.ts')
  return routes
}

export function formatFailure(phase, message) { return `FAIL [${phase}] ${message}` }

async function freePort() {
  const server = createServer()
  await new Promise((resolve, reject) => server.once('error', reject).listen(0, '127.0.0.1', resolve))
  const { port } = server.address()
  await new Promise(resolve => server.close(resolve))
  return port
}

let previewChild
function previewAlive(child) {
  return child.exitCode === null && child.signalCode === null
}

function signalPreview(child, signal) {
  try {
    if (process.platform !== 'win32') process.kill(-child.pid, signal)
    else child.kill(signal)
  } catch (error) {
    if (error?.code !== 'ESRCH') throw error
  }
}

async function stopPreview() {
  const child = previewChild
  if (!child) return
  try {
    if (previewAlive(child)) signalPreview(child, 'SIGTERM')
    if (previewAlive(child)) await Promise.race([new Promise(resolve => child.once('exit', resolve)), delay(3000)])
    if (previewAlive(child)) signalPreview(child, 'SIGKILL')
  } finally {
    previewChild = undefined
  }
}

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, () => {
    void stopPreview().finally(() => process.exit(signal === 'SIGINT' ? 130 : 143))
  })
}

async function renderRoutes(port, routes) {
  console.log(`[render] preview and readiness probe at http://127.0.0.1:${port}/`)
  const viteBin = fileURLToPath(new URL('../node_modules/vite/bin/vite.js', import.meta.url))
  const child = spawn(process.execPath, [viteBin, 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { stdio: ['ignore', 'pipe', 'pipe'], detached: process.platform !== 'win32' })
  previewChild = child
  let logs = ''
  child.stdout.setEncoding('utf8').on('data', chunk => { logs += chunk })
  child.stderr.setEncoding('utf8').on('data', chunk => { logs += chunk })
  let browser
  try {
    const base = `http://127.0.0.1:${port}`
    let ready = false
    const readyDeadline = Date.now() + 10_000
    for (let attempt = 0; attempt < 100 && Date.now() < readyDeadline; attempt += 1) {
      if (!previewAlive(child)) throw Error(`preview exited early: ${logs}`)
      try {
        const timeout = Math.min(1000, readyDeadline - Date.now())
        const response = await fetch(`${base}/`, { signal: AbortSignal.timeout(timeout) })
        if (response.ok) { ready = true; break }
      } catch {}
      await delay(Math.min(100, Math.max(0, readyDeadline - Date.now())))
    }
    if (!ready) throw Error(`preview readiness timed out: ${logs}`)
    browser = await chromium.launch({ headless: true })
    const page = await browser.newPage()
    let activeIndex = 0
    const errors = []
    page.on('console', message => { if (message.type() === 'error') errors.push({ index: activeIndex, message: message.text() }) })
    page.on('pageerror', error => errors.push({ index: activeIndex, message: error.message }))
    for (const route of routes) {
      activeIndex = 0
      console.log(`[render] browser route http://127.0.0.1:${port}/${route.slug}`)
      await page.goto(`${base}/${route.slug}`, { waitUntil: 'networkidle' })
      const root = page.locator('[data-presentation-root]')
      const count = Number(await root.getAttribute('data-step-count'))
      if (!Number.isInteger(count) || count < 1) throw Error(`${route.slug} rendered no steps`)
      for (let index = 1; index < count; index += 1) {
        activeIndex = index
        await page.keyboard.press('ArrowRight')
        try { await page.waitForFunction(expected => Number(document.querySelector('[data-presentation-root]')?.getAttribute('data-step-index')) === expected, index, { timeout: 2500 }) }
        catch { throw Error(`${route.slug} step ${index} did not advance (data-step-index)` ) }
      }
      await page.waitForTimeout(650)
      const error = errors.find(item => item.index >= 0)
      if (error) throw Error(`${route.slug} step ${error.index}: ${error.message}`)
    }
  } finally {
    await browser?.close()
    await stopPreview()
  }
}

async function run() {
  let phase = 'arguments'
  try {
    const args = parseArgs(process.argv.slice(2))
    phase = 'build'
    if (!args.skipBuild) {
      const result = await new Promise((resolve, reject) => {
        const child = spawn('npm', ['run', 'build'], { stdio: 'inherit' })
        child.once('error', reject)
        child.once('exit', (code, signal) => resolve({ code, signal }))
      })
      if (result.code !== 0) throw Error(`npm run build exited ${result.signal ?? result.code}`)
    }
    const registry = await readFile(new URL('../src/presentations/index.ts', import.meta.url), 'utf8')
    const routes = parsePresentationRoutes(registry)
    phase = 'render'
    await renderRoutes(args.port ?? await freePort(), routes)
    console.log('PASS [verify] build and registered route rendering completed')
    return 0
  } catch (error) {
    console.error(formatFailure(phase, error instanceof Error ? error.message : String(error)))
    return 1
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) process.exitCode = await run()
