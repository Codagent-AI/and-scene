// Shared helpers for verify.mjs and inspect-presentation.mjs.
import { spawn } from 'node:child_process'
import { createServer } from 'node:net'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export const HOST = '127.0.0.1'
export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

export class CheckError extends Error {
  constructor(phase, message, step) {
    super(message)
    this.phase = phase
    this.step = step
  }
}

/** Cleanup callbacks (preview server, browser) run on Ctrl-C / SIGTERM before exiting. */
export const cleanups = new Set()
let signalled = false
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    if (signalled) return
    signalled = true
    Promise.allSettled([...cleanups].map((fn) => fn())).finally(() => process.exit(130))
  })
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

export function freePort() {
  return new Promise((resolvePort, reject) => {
    const server = createServer()
    server.once('error', reject)
    server.listen(0, HOST, () => {
      const { port } = server.address()
      server.close(() => resolvePort(port))
    })
  })
}

/** Runs a command to completion in the project root, streaming output. */
export function run(cmd, args, phase) {
  return new Promise((res, rej) => {
    const child = spawn(cmd, args, { cwd: ROOT, stdio: 'inherit', shell: process.platform === 'win32' })
    child.once('error', (e) => rej(new CheckError(phase, e.message)))
    child.once('exit', (code) =>
      code === 0 ? res() : rej(new CheckError(phase, `\`${cmd} ${args.join(' ')}\` exited with code ${code}`)),
    )
  })
}

const viteBin = () => join(ROOT, 'node_modules', 'vite', 'bin', 'vite.js')

/** Starts `vite preview` on the IPv4 loopback address and resolves once it answers. */
export async function startPreview() {
  if (!existsSync(join(ROOT, 'dist'))) throw new CheckError('preview', 'dist/ is missing: run the build first')
  const port = await freePort()
  const child = spawn(process.execPath, [viteBin(), 'preview', '--host', HOST, '--port', String(port), '--strictPort'], {
    cwd: ROOT,
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: process.platform !== 'win32',
  })
  let output = ''
  child.stdout.on('data', (d) => (output += d))
  child.stderr.on('data', (d) => (output += d))
  let exited = false
  child.once('exit', () => (exited = true))
  const base = `http://${HOST}:${port}`
  const stop = () => {
    if (exited) return
    try {
      process.kill(process.platform === 'win32' ? child.pid : -child.pid, 'SIGTERM')
    } catch {
      child.kill('SIGTERM')
    }
  }
  const cleanup = () => {
    stop()
    cleanups.delete(cleanup)
  }
  cleanups.add(cleanup)
  for (let i = 0; i < 100; i++) {
    if (exited) {
      cleanup()
      throw new CheckError('preview', `preview server exited early:\n${output}`)
    }
    try {
      const res = await fetch(`${base}/`, { signal: AbortSignal.timeout(1000) })
      if (res.ok) return { base, stop: cleanup }
    } catch {
      /* not ready yet */
    }
    await sleep(100)
  }
  cleanup()
  throw new CheckError('preview', `preview server did not become ready at ${base}:\n${output}`)
}

export function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'))
}

/** Slugs of every registered presentation, read from the landing page links. */
export async function registeredSlugs(page, base) {
  await page.goto(`${base}/`)
  await page.waitForSelector('[data-presentation-landing]', { timeout: 10000 })
  return page.$$eval('a[data-presentation-link]', (as) => as.map((a) => a.getAttribute('data-presentation-link')))
}

export const SELECTORS = {
  root: '[data-presentation-root]',
  title: '[data-presentation-title]',
  caption: '[data-presentation-caption]',
}

export async function launchBrowser() {
  try {
    const { chromium } = await import('playwright')
    return await chromium.launch()
  } catch (e) {
    throw new CheckError('browser', `could not launch Chromium (try \`npx playwright install chromium\`): ${String(e.message).split('\n')[0]}`)
  }
}
