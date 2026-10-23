import { spawn } from 'node:child_process'
import { createServer } from 'node:net'
import { join } from 'node:path'

export const PREVIEW_HOST = '127.0.0.1'

/** Asks the OS for a free loopback port. */
export function freePort() {
  return new Promise((resolve, reject) => {
    const server = createServer()
    server.unref()
    server.on('error', reject)
    server.listen(0, PREVIEW_HOST, () => {
      const { port } = server.address()
      server.close(() => resolve(port))
    })
  })
}

function stopProcessGroup(child) {
  return new Promise((resolve) => {
    if (child.exitCode !== null || child.signalCode !== null) {
      resolve()
      return
    }
    const timer = setTimeout(() => {
      try {
        process.kill(-child.pid, 'SIGKILL')
      } catch {
        // The group already exited.
      }
    }, 3000)
    child.once('exit', () => {
      clearTimeout(timer)
      resolve()
    })
    try {
      process.kill(-child.pid, 'SIGTERM')
    } catch {
      clearTimeout(timer)
      resolve()
    }
  })
}

async function waitUntilServing(url, child, timeoutMs) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`vite preview exited with status ${child.exitCode}`)
    try {
      const response = await fetch(url)
      if (response.ok) return
    } catch {
      // Not listening yet.
    }
    await new Promise((resolve) => setTimeout(resolve, 200))
  }
  throw new Error(`vite preview did not answer at ${url} within ${timeoutMs} ms`)
}

/**
 * Serves the production build of `root` on a loopback port and returns its base URL.
 * `stop()` terminates the whole preview process group.
 */
export async function startPreview(root, { timeoutMs = 30_000 } = {}) {
  const port = await freePort()
  const vite = join(root, 'node_modules', 'vite', 'bin', 'vite.js')
  const child = spawn(
    process.execPath,
    [vite, 'preview', '--host', PREVIEW_HOST, '--port', String(port), '--strictPort'],
    { cwd: root, detached: true, stdio: ['ignore', 'ignore', 'pipe'] },
  )
  let stderr = ''
  child.stderr.on('data', (chunk) => {
    stderr += chunk.toString()
  })
  const url = `http://${PREVIEW_HOST}:${port}`
  try {
    await waitUntilServing(url, child, timeoutMs)
  } catch (error) {
    await stopProcessGroup(child)
    throw new Error(`${error.message}${stderr ? `: ${stderr.trim()}` : ''}`, { cause: error })
  }
  return { url, port, pid: child.pid, stop: () => stopProcessGroup(child) }
}
