// Shared by verify.mjs and inspect-presentation.mjs: spawn, port, readiness and teardown helpers
// for the `vite preview` server they drive.
import { spawn } from 'node:child_process'
import http from 'node:http'
import net from 'node:net'

export const HOST = '127.0.0.1'

export function run(cmd, args, cwd) {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { cwd, stdio: ['ignore', 'pipe', 'pipe'] })
    let out = ''
    child.stdout.on('data', (d) => (out += d))
    child.stderr.on('data', (d) => (out += d))
    child.on('error', (e) => resolve({ code: 1, out: String(e) }))
    child.on('close', (code) => resolve({ code: code ?? 1, out }))
  })
}

export function freePort() {
  return new Promise((resolve, reject) => {
    const s = net.createServer()
    s.once('error', reject)
    s.listen(0, HOST, () => {
      const { port } = s.address()
      s.close(() => resolve(port))
    })
  })
}

function probe(url) {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      res.resume()
      resolve(res.statusCode === 200)
    })
    req.on('error', () => resolve(false))
    req.setTimeout(1000, () => req.destroy())
  })
}

export async function waitReady(url, child, timeoutMs = 30000) {
  const end = Date.now() + timeoutMs
  while (Date.now() < end) {
    if (child.exitCode !== null) return false
    if (await probe(url)) return true
    await new Promise((r) => setTimeout(r, 150))
  }
  return false
}

export function killTree(child) {
  if (!child || child.exitCode !== null) return
  try {
    process.kill(-child.pid, 'SIGTERM')
  } catch {
    try {
      child.kill('SIGTERM')
    } catch {
      /* already gone */
    }
  }
}
