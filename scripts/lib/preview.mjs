import { spawn } from 'node:child_process'
import net from 'node:net'
import { createRequire } from 'node:module'
import path from 'node:path'

/** Verification and inspection always use the IPv4 loopback address, never `localhost`. */
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

export function runCommand(cmd, args, cwd) {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { cwd, stdio: ['ignore', 'pipe', 'pipe'] })
    let output = ''
    child.stdout.on('data', (d) => (output += d))
    child.stderr.on('data', (d) => (output += d))
    child.on('error', (error) => resolve({ code: 1, output: String(error) }))
    child.on('close', (code) => resolve({ code: code ?? 1, output }))
  })
}

async function waitUntilReady(url, timeoutMs) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url)
      if (response.ok) return
    } catch {
      // not listening yet
    }
    await new Promise((r) => setTimeout(r, 150))
  }
  throw new Error(`preview did not become ready at ${url}`)
}

/** Starts `vite preview` on 127.0.0.1 in its own process group; `stop()` kills the whole group. */
export async function startPreview(cwd) {
  const port = await freePort()
  const viteBin = path.join(cwd, 'node_modules', 'vite', 'bin', 'vite.js')
  const child = spawn(
    process.execPath,
    [viteBin, 'preview', '--host', HOST, '--port', String(port), '--strictPort'],
    { cwd, stdio: 'ignore', detached: true },
  )
  const url = `http://${HOST}:${port}`
  const stop = () => {
    try {
      process.kill(-child.pid, 'SIGKILL')
    } catch {
      // already gone
    }
  }
  try {
    await waitUntilReady(`${url}/`, 20000)
  } catch (error) {
    stop()
    throw error
  }
  return { url, stop }
}

export async function launchChromium(cwd) {
  const { chromium } = createRequire(path.join(cwd, 'package.json'))('playwright')
  return chromium.launch()
}
