// Shared by verify.mjs and inspect-presentation.mjs: a production preview on the IPv4 loopback.
import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
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

/** Starts `vite preview` bound to 127.0.0.1 and resolves once it answers a probe. */
export async function startPreview(root, port, { timeoutMs = 30000 } = {}) {
  const vite = path.join(root, 'node_modules', 'vite', 'bin', 'vite.js')
  if (!existsSync(vite)) throw new Error(`vite is not installed in ${root}; run npm ci`)
  const child = spawn(process.execPath, [vite, 'preview', '--host', HOST, '--port', String(port), '--strictPort'], {
    cwd: root,
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  let output = ''
  child.stdout.on('data', (d) => (output += d))
  child.stderr.on('data', (d) => (output += d))
  const exited = new Promise((resolve) => child.once('exit', resolve))
  const url = `http://${HOST}:${port}`
  const deadline = Date.now() + timeoutMs
  for (;;) {
    if (child.exitCode !== null) throw new Error(`preview exited early:\n${output.trim()}`)
    try {
      const res = await fetch(`${url}/`, { signal: AbortSignal.timeout(1500) })
      if (res.ok) break
    } catch {
      /* not ready yet */
    }
    if (Date.now() > deadline) {
      child.kill('SIGKILL')
      throw new Error(`preview was not ready at ${url} within ${timeoutMs}ms:\n${output.trim()}`)
    }
    await new Promise((r) => setTimeout(r, 150))
  }
  return {
    url,
    async stop() {
      if (child.exitCode === null) {
        child.kill('SIGTERM')
        const timer = setTimeout(() => child.kill('SIGKILL'), 3000)
        await exited
        clearTimeout(timer)
      }
    },
  }
}

/** Collects console and page errors from the moment it is attached. */
export function trackErrors(page) {
  const errors = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`console.error: ${msg.text()}`)
  })
  page.on('pageerror', (err) => errors.push(`uncaught: ${err.message}`))
  return errors
}

/** Waits until the chrome reports `index` as the active step; returns false on timeout. */
export async function waitForStep(page, index, timeout = 4000) {
  try {
    await page.waitForFunction(
      (i) => document.querySelector('[data-step-count]')?.getAttribute('data-step-index') === String(i),
      index,
      { timeout },
    )
    return true
  } catch {
    return false
  }
}
