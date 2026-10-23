import { spawn } from 'node:child_process'
import { createServer } from 'node:net'
import { join } from 'node:path'

const HOST = '127.0.0.1'
const READY_TIMEOUT_MS = 30_000

/** Asks the OS for a free loopback port. */
export function findFreePort() {
  return new Promise((resolve, reject) => {
    const server = createServer()
    server.unref()
    server.on('error', reject)
    server.listen(0, HOST, () => {
      const { port } = server.address()
      server.close(() => resolve(port))
    })
  })
}

/** Runs the production build in `root`, streaming its output with a `build:` prefix. */
export function runBuild(root, log) {
  return new Promise((resolve, reject) => {
    const child = spawn('npm', ['run', 'build'], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] })
    const relay = (chunk) => {
      for (const line of String(chunk).split('\n')) if (line.trim()) log(`build: ${line}`)
    }
    child.stdout.on('data', relay)
    child.stderr.on('data', relay)
    child.on('error', reject)
    child.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`npm run build exited with ${code}`))))
  })
}

/**
 * Starts `vite preview` on the loopback address in its own process group, so the
 * whole tree can be stopped. Resolves once the preview answers an HTTP probe.
 */
export async function startPreview(root, port) {
  const viteBin = join(root, 'node_modules', 'vite', 'bin', 'vite.js')
  const child = spawn(
    process.execPath,
    [viteBin, 'preview', '--host', HOST, '--port', String(port), '--strictPort'],
    { cwd: root, detached: true, stdio: ['ignore', 'pipe', 'pipe'] },
  )
  let exited = null
  child.on('exit', (code, signal) => {
    exited = { code, signal }
  })

  const url = `http://${HOST}:${port}`
  const deadline = Date.now() + READY_TIMEOUT_MS
  while (Date.now() < deadline) {
    if (exited) throw new Error(`vite preview exited (${exited.code ?? exited.signal}) before it was ready`)
    try {
      const response = await fetch(`${url}/`)
      if (response.ok) return { url, stop: () => stopProcessGroup(child) }
    } catch {
      // Not listening yet; retry until the deadline.
    }
    await new Promise((resolve) => setTimeout(resolve, 150))
  }
  await stopProcessGroup(child)
  throw new Error(`vite preview was not ready at ${url} within ${READY_TIMEOUT_MS} ms`)
}

/** Stops a detached child and every process it started. */
export function stopProcessGroup(child) {
  if (child.exitCode !== null || child.signalCode !== null) return Promise.resolve()
  return new Promise((resolve) => {
    child.once('exit', resolve)
    try {
      process.kill(-child.pid, 'SIGTERM')
    } catch {
      resolve()
    }
    setTimeout(() => {
      try {
        process.kill(-child.pid, 'SIGKILL')
      } catch {
        // Already gone.
      }
    }, 2_000).unref()
  })
}
