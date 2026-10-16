import { spawn } from 'node:child_process'
import net from 'node:net'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/** Deterministic IPv4 loopback for the preview server, readiness probe and browser URLs. */
export const HOST = '127.0.0.1'

export const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

export function run(cmd, args, cwd) {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { cwd, stdio: ['ignore', 'pipe', 'pipe'] })
    let output = ''
    child.stdout.on('data', (d) => (output += d))
    child.stderr.on('data', (d) => (output += d))
    child.on('error', (e) => resolve({ code: 1, output: String(e) }))
    child.on('close', (code) => resolve({ code: code ?? 1, output }))
  })
}

function freePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer()
    srv.once('error', reject)
    srv.listen(0, HOST, () => {
      const { port } = srv.address()
      srv.close(() => resolve(port))
    })
  })
}

/** Starts `vite preview` on 127.0.0.1 and waits until it answers. */
export async function startPreview(root) {
  const port = await freePort()
  const vite = path.join(root, 'node_modules', '.bin', 'vite')
  const child = spawn(vite, ['preview', '--host', HOST, '--port', String(port), '--strictPort'], {
    cwd: root,
    detached: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  let log = ''
  child.stdout.on('data', (d) => (log += d))
  child.stderr.on('data', (d) => (log += d))
  let exited = false
  child.on('exit', () => (exited = true))
  const base = `http://${HOST}:${port}`
  const stop = () => {
    if (exited || !child.pid) return
    try {
      process.kill(-child.pid, 'SIGTERM')
    } catch {
      /* already gone */
    }
  }
  const deadline = Date.now() + 30_000
  while (Date.now() < deadline) {
    if (exited) break
    try {
      const res = await fetch(`${base}/`)
      if (res.ok) return { base, stop }
    } catch {
      /* not ready yet */
    }
    await new Promise((r) => setTimeout(r, 150))
  }
  stop()
  throw new Error(`preview did not become ready on ${base}\n${log}`)
}

export const STEP = '[data-step-index]'

export const readIndex = (page) => page.getAttribute(STEP, 'data-step-index').then(Number)

export async function waitForIndex(page, expected, timeout = 4000) {
  try {
    await page.waitForFunction(
      ([sel, want]) => document.querySelector(sel)?.getAttribute('data-step-index') === String(want),
      [STEP, expected],
      { timeout },
    )
    return true
  } catch {
    return false
  }
}
