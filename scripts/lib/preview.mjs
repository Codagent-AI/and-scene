import { spawn } from 'node:child_process'
import { createServer } from 'node:net'
import path from 'node:path'

/** Deterministic IPv4 loopback; a loopback hostname may resolve to IPv6 depending on the runtime. */
export const HOST = '127.0.0.1'

export function freePort() {
  return new Promise((resolve, reject) => {
    const server = createServer()
    server.once('error', reject)
    server.listen(0, HOST, () => {
      const { port } = server.address()
      server.close(() => resolve(port))
    })
  })
}

/** Runs a command to completion, streaming output; resolves with the exit code. */
export function run(cmd, args, { cwd, quiet = false } = {}) {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { cwd, stdio: quiet ? 'ignore' : 'inherit' })
    child.on('error', () => resolve(1))
    child.on('close', (code) => resolve(code ?? 1))
  })
}

async function waitUntilReady(url, child, timeoutMs = 30_000) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error('preview server exited before it was ready')
    try {
      const res = await fetch(url)
      if (res.ok) return
    } catch {
      // not listening yet
    }
    await new Promise((r) => setTimeout(r, 150))
  }
  throw new Error(`preview server not ready at ${url} after ${timeoutMs}ms`)
}

/** Starts `vite preview` on 127.0.0.1; `stop()` kills its whole process group. */
export async function startPreview(cwd) {
  const port = await freePort()
  const vite = path.join(cwd, 'node_modules', 'vite', 'bin', 'vite.js')
  const child = spawn(
    process.execPath,
    [vite, 'preview', '--host', HOST, '--port', String(port), '--strictPort'],
    { cwd, stdio: 'ignore', detached: true },
  )
  const stop = () => {
    try {
      process.kill(-child.pid, 'SIGKILL')
    } catch {
      // already gone
    }
  }
  const baseUrl = `http://${HOST}:${port}`
  try {
    await waitUntilReady(`${baseUrl}/`, child)
  } catch (err) {
    stop()
    throw err
  }
  return { baseUrl, port, stop }
}

export async function launchChromium() {
  const { chromium } = await import('playwright')
  return chromium.launch()
}
