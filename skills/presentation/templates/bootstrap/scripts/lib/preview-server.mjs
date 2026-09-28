import { spawn } from 'node:child_process'
import { createServer as createNetServer } from 'node:net'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { createServer as createViteServer } from 'vite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
export const PROJECT_ROOT = path.resolve(__dirname, '..', '..')

/** Finds a free TCP port on 127.0.0.1 for the preview server to bind to. */
export function getFreePort() {
  return new Promise((resolve, reject) => {
    const server = createNetServer()
    server.unref()
    server.on('error', reject)
    server.listen(0, '127.0.0.1', () => {
      const address = server.address()
      const port = typeof address === 'object' && address ? address.port : null
      server.close(() => {
        if (port) resolve(port)
        else reject(new Error('Could not allocate a free port'))
      })
    })
  })
}

/**
 * Reads the registered { slug, title } entries by actually running
 * `src/presentations/index.ts` through Vite's SSR module runner, rather than
 * pattern-matching its source. This handles every valid registry entry shape
 * (shorthand properties, computed values, spread, helper functions building
 * the array, etc.) the same way the real app would, so no entry can silently
 * fail to be picked up by verification.
 */
export async function readRegistrySlugs() {
  const server = await createViteServer({
    root: PROJECT_ROOT,
    server: { middlewareMode: true },
    logLevel: 'silent',
  })

  try {
    const mod = await server.ssrLoadModule('/src/presentations/index.ts')
    const presentations = mod.presentations
    if (!Array.isArray(presentations)) {
      throw new Error('src/presentations/index.ts must export a "presentations" array')
    }

    return presentations.map(({ slug, title }, index) => {
      if (typeof slug !== 'string' || typeof title !== 'string') {
        throw new Error(`presentations[${index}] must have string "slug" and "title" fields, got: ${JSON.stringify({ slug, title })}`)
      }
      return { slug, title }
    })
  } finally {
    await server.close()
  }
}

async function waitForReady(url, timeoutMs = 30_000) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(url)
      if (response.ok || response.status === 404) return
    } catch {
      // server not up yet
    }
    await new Promise((resolve) => setTimeout(resolve, 200))
  }
  throw new Error(`Timed out waiting for preview server at ${url}`)
}

/**
 * Starts `vite preview` bound to 127.0.0.1 on a free port and waits until it
 * responds. Runs the local `vite` binary directly (not through `npx`) and in
 * its own process group, so `stop()` can reliably kill the whole tree —
 * `npx`-wrapped children otherwise can outlive a signal sent to the wrapper.
 */
export async function startPreviewServer() {
  const port = await getFreePort()
  const host = '127.0.0.1'
  const viteBin = path.join(PROJECT_ROOT, 'node_modules', '.bin', 'vite')
  const child = spawn(viteBin, ['preview', '--host', host, '--port', String(port), '--strictPort'], {
    cwd: PROJECT_ROOT,
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: true,
  })

  let output = ''
  child.stdout?.on('data', (chunk) => {
    output += chunk.toString()
  })
  child.stderr?.on('data', (chunk) => {
    output += chunk.toString()
  })

  const baseUrl = `http://${host}:${port}`

  function stop() {
    return new Promise((resolve) => {
      if (child.exitCode !== null || child.pid === undefined) {
        resolve()
        return
      }
      child.once('exit', () => resolve())
      try {
        process.kill(-child.pid, 'SIGTERM')
      } catch {
        child.kill('SIGTERM')
      }
    })
  }

  try {
    await waitForReady(baseUrl)
  } catch (error) {
    await stop()
    throw new Error(`${error.message}\n${output}`)
  }

  return { baseUrl, stop }
}
