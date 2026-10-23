import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import net from 'node:net'
import { join } from 'node:path'
import { setTimeout as sleep } from 'node:timers/promises'

/** IPv4 loopback everywhere: the preview host, readiness probe, and browser URLs. */
export const HOST = '127.0.0.1'

const READY_TIMEOUT_MS = 30_000

export function freePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer()
    server.on('error', reject)
    server.listen(0, HOST, () => {
      const { port } = server.address()
      server.close(() => resolve(port))
    })
  })
}

/** Serves the production build (`vite preview`) on a free loopback port. */
export async function startPreview(root) {
  const port = await freePort()
  const vite = join(root, 'node_modules', 'vite', 'bin', 'vite.js')
  if (!existsSync(vite)) throw new Error('vite is not installed; run npm ci first')
  const child = spawn(
    process.execPath,
    [vite, 'preview', '--host', HOST, '--port', String(port), '--strictPort'],
    { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] },
  )
  let log = ''
  child.stdout.on('data', (chunk) => (log += chunk))
  child.stderr.on('data', (chunk) => (log += chunk))
  const url = `http://${HOST}:${port}`
  try {
    await waitForReady(url, child, () => log)
  } catch (error) {
    await stopChild(child)
    throw error
  }
  return { url, port, stop: () => stopChild(child) }
}

async function waitForReady(url, child, output) {
  const deadline = Date.now() + READY_TIMEOUT_MS
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`preview exited early:\n${output()}`)
    try {
      const response = await fetch(url)
      if (response.ok) return
    } catch {
      // not listening yet
    }
    await sleep(200)
  }
  throw new Error(`preview did not become ready at ${url}:\n${output()}`)
}

/** Stops a child process and waits for it to exit; escalates to SIGKILL if needed. */
export async function stopChild(child) {
  // Listen before checking, so an exit between the check and the kill is not missed.
  const exited = new Promise((resolve) => child.once('exit', resolve))
  if (child.exitCode !== null || child.signalCode !== null) return
  child.kill('SIGTERM')
  const killer = setTimeout(() => child.kill('SIGKILL'), 5_000)
  // Bound the wait so a child that ignores SIGKILL cannot hang the run. The bound timer is
  // cleared once the race settles, so a prompt exit does not keep the event loop alive.
  let bound
  const timeout = new Promise((resolve) => {
    bound = setTimeout(resolve, 10_000)
  })
  try {
    await Promise.race([exited, timeout])
  } finally {
    clearTimeout(bound)
    clearTimeout(killer)
  }
}
