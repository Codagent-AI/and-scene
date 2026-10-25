// Shared helpers: run commands and a production preview bound to 127.0.0.1.
import { spawn } from 'node:child_process'
import net from 'node:net'
import path from 'node:path'

export const HOST = '127.0.0.1'

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

/** Runs a command to completion, returning its exit code and combined output. */
export function run(command, args, cwd) {
  return new Promise((resolve) => {
    const child = spawn(command, args, { cwd, stdio: ['ignore', 'pipe', 'pipe'] })
    let output = ''
    child.stdout.on('data', (d) => (output += d))
    child.stderr.on('data', (d) => (output += d))
    child.on('error', (err) => resolve({ code: 1, output: String(err) }))
    child.on('close', (code) => resolve({ code: code ?? 1, output }))
  })
}

async function waitReady(url, child, timeoutMs) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`preview server exited with code ${child.exitCode}`)
    try {
      const res = await fetch(url)
      if (res.ok) return
    } catch {
      // not listening yet
    }
    await new Promise((r) => setTimeout(r, 100))
  }
  throw new Error(`preview server not ready at ${url} after ${timeoutMs}ms`)
}

/** Starts `vite preview` on the IPv4 loopback; stop() kills the whole process group. */
export async function startPreview(root) {
  const port = await freePort()
  const vite = path.join(root, 'node_modules', 'vite', 'bin', 'vite.js')
  const child = spawn(process.execPath, [vite, 'preview', '--host', HOST, '--port', String(port), '--strictPort'], {
    cwd: root,
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: true,
  })
  let log = ''
  child.stdout.on('data', (d) => (log += d))
  child.stderr.on('data', (d) => (log += d))
  const stop = () => {
    if (child.exitCode !== null || child.pid === undefined) return
    try {
      process.kill(-child.pid, 'SIGTERM')
    } catch {
      child.kill('SIGTERM')
    }
  }
  process.once('exit', stop)
  const url = `http://${HOST}:${port}`
  try {
    await waitReady(`${url}/`, child, 30_000)
  } catch (err) {
    stop()
    throw new Error(`${err.message}\n${log}`, { cause: err })
  }
  return { url, stop }
}
