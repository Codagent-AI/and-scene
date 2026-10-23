// Shared by verify.mjs and inspect-presentation.mjs: build, free port, and a production preview
// on the deterministic IPv4 loopback address.
import { spawn } from 'node:child_process'
import net from 'node:net'
import path from 'node:path'

export const HOST = '127.0.0.1'

/** Run a command to completion, capturing combined output. */
export function run(cmd, args, cwd) {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { cwd, stdio: ['ignore', 'pipe', 'pipe'] })
    let out = ''
    child.stdout.on('data', (d) => (out += d))
    child.stderr.on('data', (d) => (out += d))
    child.on('error', (e) => resolve({ code: 1, out: String(e) }))
    child.on('close', (code) => resolve({ code, out }))
  })
}

export function freePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer()
    server.once('error', reject)
    server.listen(0, HOST, () => {
      const { port } = server.address()
      server.close(() => resolve(port))
    })
  })
}

/** Start `vite preview` on HOST:port and wait until it answers. Resolves to { stop }; rejects with the log if it never does. */
export async function startPreview(root, port) {
  const vite = path.join(root, 'node_modules/vite/bin/vite.js')
  const child = spawn(process.execPath, [vite, 'preview', '--host', HOST, '--port', String(port), '--strictPort'], {
    cwd: root,
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  let log = ''
  child.stdout.on('data', (d) => (log += d))
  child.stderr.on('data', (d) => (log += d))
  const stop = () =>
    new Promise((resolve) => {
      if (child.exitCode !== null || child.signalCode !== null) return resolve()
      child.once('exit', resolve)
      child.kill('SIGTERM')
      setTimeout(() => child.kill('SIGKILL'), 3000).unref()
    })
  const deadline = Date.now() + 30_000
  while (Date.now() < deadline && child.exitCode === null) {
    try {
      if ((await fetch(`http://${HOST}:${port}/`)).ok) return { stop }
    } catch {
      /* not ready yet */
    }
    await new Promise((r) => setTimeout(r, 200))
  }
  await stop()
  throw new Error(`vite preview did not become ready on ${HOST}:${port}\n${log.trim()}`)
}
