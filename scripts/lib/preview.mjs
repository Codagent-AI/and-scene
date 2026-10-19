import { spawn } from 'node:child_process'
import { createServer } from 'node:net'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

/** Deterministic IPv4 loopback, independent of how the host name resolves. */
export const HOST = '127.0.0.1'

export const urlFor = (port, path = '/') => `http://${HOST}:${port}${path}`

export function freePort() {
  return new Promise((resolve, reject) => {
    const srv = createServer()
    srv.once('error', reject)
    srv.listen(0, HOST, () => {
      const { port } = srv.address()
      srv.close(() => resolve(port))
    })
  })
}

export async function waitReady(url, timeoutMs = 30000) {
  const deadline = Date.now() + timeoutMs
  let last
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url)
      if (res.ok) return
      last = `HTTP ${res.status}`
    } catch (e) {
      last = e.message
    }
    await new Promise((r) => setTimeout(r, 150))
  }
  throw new Error(`preview at ${url} not ready after ${timeoutMs}ms (${last})`)
}

/** Serve the production build with `vite preview` on 127.0.0.1. */
export async function startPreview(cwd, { port, timeoutMs } = {}) {
  const vite = join(cwd, 'node_modules', 'vite', 'bin', 'vite.js')
  if (!existsSync(vite)) throw new Error(`vite not installed in ${cwd}`)
  const chosen = port ?? (await freePort())
  const child = spawn(process.execPath, [vite, 'preview', '--host', HOST, '--port', String(chosen), '--strictPort'], {
    cwd,
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  let output = ''
  child.stdout.on('data', (d) => (output += d))
  child.stderr.on('data', (d) => (output += d))
  const exited = new Promise((_, reject) => child.once('exit', (code) => reject(new Error(`vite preview exited (${code}): ${output.trim()}`))))
  exited.catch(() => {})
  const stop = () =>
    new Promise((resolve) => {
      if (child.exitCode !== null || child.signalCode !== null) return resolve()
      const killer = setTimeout(() => child.kill('SIGKILL'), 3000)
      child.once('exit', () => {
        clearTimeout(killer)
        resolve()
      })
      child.kill('SIGTERM')
    })
  try {
    await Promise.race([waitReady(urlFor(chosen), timeoutMs), exited])
  } catch (e) {
    await stop()
    throw e
  }
  return { port: chosen, url: urlFor(chosen), stop, pid: child.pid }
}

/** Run an npm script, resolving with its exit code and combined output. */
export function runNpm(cwd, args) {
  return new Promise((resolve) => {
    const child = spawn('npm', args, { cwd, stdio: ['ignore', 'pipe', 'pipe'] })
    let output = ''
    child.stdout.on('data', (d) => (output += d))
    child.stderr.on('data', (d) => (output += d))
    child.on('error', (e) => resolve({ code: 1, output: e.message }))
    child.on('close', (code) => resolve({ code: code ?? 1, output }))
  })
}

/** Resolve a Chromium executable or explain how to get one. */
export async function launchChromium() {
  const { chromium } = await import('playwright')
  const path = chromium.executablePath()
  if (!existsSync(path)) throw new Error(`Playwright Chromium is not installed (${path}); run: npx playwright install chromium`)
  return chromium.launch()
}
