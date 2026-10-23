// Shared by verify and inspect: build and production-preview helpers pinned to IPv4 loopback.
import { spawn } from 'node:child_process'
import { createRequire } from 'node:module'
import net from 'node:net'
import path from 'node:path'

export const HOST = '127.0.0.1'

export function previewUrl(port, route = '/') {
  return `http://${HOST}:${port}${route}`
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

/** Runs a command to completion, resolving with its exit code and combined output. */
export function run(command, args, { cwd, env } = {}) {
  return new Promise((resolve) => {
    const child = spawn(command, args, { cwd, env: { ...process.env, ...env }, stdio: ['ignore', 'pipe', 'pipe'] })
    let output = ''
    child.stdout.on('data', (d) => (output += d))
    child.stderr.on('data', (d) => (output += d))
    child.on('error', (err) => resolve({ code: 1, output: output + String(err) }))
    child.on('close', (code) => resolve({ code: code ?? 1, output }))
  })
}

export function runBuild(cwd) {
  return run('npm', ['run', 'build'], { cwd })
}

function viteBin(cwd) {
  const require = createRequire(path.join(cwd, 'package.json'))
  return path.join(path.dirname(require.resolve('vite/package.json')), 'bin', 'vite.js')
}

async function waitReady(url, child, timeoutMs) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`preview exited early with code ${child.exitCode}`)
    try {
      const res = await fetch(url)
      if (res.ok) return
    } catch {
      // not listening yet
    }
    await new Promise((r) => setTimeout(r, 150))
  }
  throw new Error(`preview did not become ready at ${url}`)
}

/** Starts `vite preview` on 127.0.0.1 in its own process group; `stop()` kills the whole group. */
export async function startPreview(cwd, { timeoutMs = 30_000 } = {}) {
  const port = await freePort()
  const child = spawn(process.execPath, [viteBin(cwd), 'preview', '--host', HOST, '--port', String(port), '--strictPort'], {
    cwd,
    detached: true,
    stdio: 'ignore',
  })
  const exited = new Promise((resolve) => child.once('exit', resolve))
  const stop = async () => {
    if (child.exitCode === null && child.pid) {
      try {
        process.kill(-child.pid, 'SIGTERM')
      } catch {
        // already gone
      }
      const timer = setTimeout(() => {
        try {
          process.kill(-child.pid, 'SIGKILL')
        } catch {
          // already gone
        }
      }, 5000)
      await exited
      clearTimeout(timer)
    }
  }
  try {
    await waitReady(previewUrl(port), child, timeoutMs)
  } catch (err) {
    await stop()
    throw err
  }
  return { port, pid: child.pid, stop }
}
