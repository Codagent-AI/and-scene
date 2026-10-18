// Shared by verify.mjs and inspect-presentation.mjs: build the app and serve it with `vite preview`.
import { spawn } from 'node:child_process'
import { createRequire } from 'node:module'
import net from 'node:net'
import path from 'node:path'

/** Always IPv4 loopback, so nothing depends on name resolution. */
export const HOST = '127.0.0.1'

export class PhaseError extends Error {
  /**
   * @param {string} phase the failed check, e.g. `build`, `sample`, `render`
   * @param {string} message
   * @param {number | undefined} [step] zero-based index of the offending step
   */
  constructor(phase, message, step) {
    super(message)
    this.phase = phase
    this.step = step
  }
}

/** Run `npm run build` and reject with the tail of its output when it fails. */
export function runBuild(root) {
  return new Promise((resolve, reject) => {
    const child = spawn('npm', ['run', 'build'], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] })
    let output = ''
    child.stdout.on('data', (d) => (output += d))
    child.stderr.on('data', (d) => (output += d))
    child.on('error', (e) => reject(new PhaseError('build', `could not start npm: ${e.message}`)))
    child.on('close', (code) => {
      if (code === 0) return resolve()
      const tail = output.trim().split('\n').slice(-25).join('\n')
      reject(new PhaseError('build', `npm run build exited with ${code}\n${tail}`))
    })
  })
}

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

async function probe(url) {
  try {
    const res = await fetch(url)
    return res.ok
  } catch {
    return false
  }
}

/**
 * Start `vite preview` bound to 127.0.0.1 and wait until it answers on the same address.
 * @returns {Promise<{ origin: string, stop: () => Promise<void> }>}
 */
export async function startPreview(root, { timeoutMs = 30_000 } = {}) {
  const require = createRequire(path.join(root, 'package.json'))
  const viteBin = path.join(path.dirname(require.resolve('vite/package.json')), 'bin', 'vite.js')
  const port = await freePort()
  const origin = `http://${HOST}:${port}`
  const child = spawn(
    process.execPath,
    [viteBin, 'preview', '--host', HOST, '--port', String(port), '--strictPort'],
    { cwd: root, stdio: ['ignore', 'pipe', 'pipe'], detached: true },
  )
  let output = ''
  child.stdout.on('data', (d) => (output += d))
  child.stderr.on('data', (d) => (output += d))
  let exited = false
  const exit = new Promise((resolve) => child.on('exit', () => ((exited = true), resolve())))

  const stop = async () => {
    if (exited) return
    try {
      process.kill(-child.pid, 'SIGTERM')
    } catch {
      /* already gone */
    }
    await Promise.race([exit, new Promise((r) => setTimeout(r, 3000))])
    if (!exited) {
      try {
        process.kill(-child.pid, 'SIGKILL')
      } catch {
        /* already gone */
      }
      await exit
    }
  }

  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (exited) throw new PhaseError('preview', `vite preview exited early\n${output.trim()}`)
    if (await probe(`${origin}/`)) return { origin, stop }
    await new Promise((r) => setTimeout(r, 150))
  }
  await stop()
  throw new PhaseError('preview', `vite preview not ready at ${origin} after ${timeoutMs}ms\n${output.trim()}`)
}
