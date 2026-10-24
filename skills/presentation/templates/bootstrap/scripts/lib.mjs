// Shared helpers for verify.mjs and inspect-presentation.mjs (Node only, no deps).
import { spawn } from 'node:child_process'
import { readFileSync, existsSync } from 'node:fs'
import net from 'node:net'
import path from 'node:path'

export const HOST = '127.0.0.1'

/** Slugs declared in src/presentations/index.ts, in registry order. */
export function readRegistrySlugs(root) {
  const file = path.join(root, 'src/presentations/index.ts')
  if (!existsSync(file)) return []
  return [...readFileSync(file, 'utf8').matchAll(/slug:\s*['"]([^'"]+)['"]/g)].map((m) => m[1])
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

/** Runs `vite preview` bound to 127.0.0.1. Returns { url, stop }. */
export async function startPreview(root, { timeoutMs = 20000 } = {}) {
  const port = await freePort()
  const vite = path.join(root, 'node_modules/vite/bin/vite.js')
  const child = spawn(process.execPath, [vite, 'preview', '--host', HOST, '--port', String(port), '--strictPort'], {
    cwd: root,
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  let log = ''
  child.stdout.on('data', (d) => (log += d))
  child.stderr.on('data', (d) => (log += d))
  const url = `http://${HOST}:${port}`
  const stop = () =>
    new Promise((resolve) => {
      if (child.exitCode !== null || child.signalCode !== null) return resolve()
      child.once('exit', () => resolve())
      child.kill('SIGTERM')
      setTimeout(() => child.kill('SIGKILL'), 3000).unref()
    })
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`vite preview exited early:\n${log}`)
    try {
      const res = await fetch(`${url}/`)
      if (res.ok) return { url, stop }
    } catch {
      /* not ready yet */
    }
    await new Promise((r) => setTimeout(r, 150))
  }
  await stop()
  throw new Error(`vite preview did not become ready at ${url}:\n${log}`)
}

export function runBuild(root) {
  return new Promise((resolve) => {
    const child = spawn('npm', ['run', 'build'], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] })
    let out = ''
    child.stdout.on('data', (d) => (out += d))
    child.stderr.on('data', (d) => (out += d))
    child.on('close', (code) => resolve({ code, out }))
  })
}
