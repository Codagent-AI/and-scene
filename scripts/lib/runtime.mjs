// Shared plumbing for verify.mjs and inspect-presentation.mjs: registry parsing,
// production preview on 127.0.0.1, and browser launch.
import { spawn } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import net from 'node:net'
import path from 'node:path'

export const HOST = '127.0.0.1'

/** Reads `{ slug, ..., import('./dir/Talk') }` entries from src/presentations/index.ts. */
export function parseRegistry(text) {
  const entries = []
  const re = /slug:\s*(['"])(.+?)\1[\s\S]*?import\(\s*(['"])\.\/(.+?)\/Talk\3\s*\)/g
  for (const m of text.matchAll(re)) entries.push({ slug: m[2], dir: m[4] })
  return entries
}

export function readRegistry(root) {
  const file = ['index.ts', 'index.tsx']
    .map((f) => path.join(root, 'src', 'presentations', f))
    .find((f) => existsSync(f))
  return file ? parseRegistry(readFileSync(file, 'utf8')) : []
}

export function freePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer()
    srv.once('error', reject)
    srv.listen(0, HOST, () => {
      const { port } = srv.address()
      srv.close(() => resolve(port))
    })
  })
}

export function run(command, args, { cwd, label }) {
  return new Promise((resolve) => {
    const child = spawn(command, args, { cwd, stdio: ['ignore', 'pipe', 'pipe'] })
    let output = ''
    child.stdout.on('data', (d) => (output += d))
    child.stderr.on('data', (d) => (output += d))
    child.on('error', (e) => resolve({ code: 1, output: `${label}: ${e.message}` }))
    child.on('close', (code) => resolve({ code: code ?? 1, output }))
  })
}

/** Starts `vite preview` bound to 127.0.0.1 and waits until it answers on that address. */
export async function startPreview(root) {
  const vite = path.join(root, 'node_modules', 'vite', 'bin', 'vite.js')
  const port = await freePort()
  const child = spawn(
    process.execPath,
    [vite, 'preview', '--host', HOST, '--port', String(port), '--strictPort'],
    { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] },
  )
  let log = ''
  child.stdout.on('data', (d) => (log += d))
  child.stderr.on('data', (d) => (log += d))
  let exited = false
  child.on('exit', () => (exited = true))

  const origin = `http://${HOST}:${port}`
  const stop = () =>
    new Promise((resolve) => {
      if (exited) return resolve()
      child.once('exit', resolve)
      child.kill('SIGTERM')
      setTimeout(() => child.kill('SIGKILL'), 3000).unref()
    })

  const deadline = Date.now() + 30_000
  while (Date.now() < deadline) {
    if (exited) throw new Error(`preview exited early:\n${log}`)
    try {
      const res = await fetch(`${origin}/`)
      if (res.ok) return { origin, stop }
    } catch {
      /* not ready yet */
    }
    await new Promise((r) => setTimeout(r, 150))
  }
  await stop()
  throw new Error(`preview did not become ready at ${origin}:\n${log}`)
}

export async function launchBrowser(root) {
  const { chromium } = await import(
    new URL(`file://${path.join(root, 'node_modules', 'playwright', 'index.mjs')}`)
  )
  return chromium.launch({
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined,
  })
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const rootSel = '[data-presentation-root]'
export const readHooks = (page) =>
  page.evaluate((sel) => {
    const el = document.querySelector(sel)
    if (!el) return null
    return {
      count: Number(el.getAttribute('data-step-count')),
      index: Number(el.getAttribute('data-step-index')),
      mode: el.getAttribute('data-presentation-mode'),
    }
  }, rootSel)

/** Waits until the chrome reports the given step index. */
export const waitForIndex = (page, index, timeout = 4000) =>
  page.waitForFunction(
    ([sel, i]) =>
      document.querySelector(sel)?.getAttribute('data-step-index') === String(i),
    [rootSel, index],
    { timeout },
  )
