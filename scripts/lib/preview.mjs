// Shared by verify.mjs and inspect-presentation.mjs: production build + preview helpers.
import { spawn } from 'node:child_process'
import net from 'node:net'
import path from 'node:path'

/** Deterministic IPv4 loopback so `localhost` resolution never matters. */
export const HOST = '127.0.0.1'

export const urlFor = (port, pathname = '/') => `http://${HOST}:${port}${pathname}`

export class PhaseError extends Error {
  constructor(phase, message, step) {
    super(message)
    this.phase = phase
    this.step = step
  }
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

export function runNpm(args, { cwd, phase }) {
  return new Promise((resolve, reject) => {
    const child = spawn('npm', args, { cwd, stdio: 'inherit' })
    child.once('error', (error) => reject(new PhaseError(phase, error.message)))
    child.once('exit', (code) =>
      code === 0 ? resolve() : reject(new PhaseError(phase, `npm ${args.join(' ')} exited with code ${code}`)),
    )
  })
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function waitForReady(url, child, timeoutMs, phase) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new PhaseError(phase, `preview exited early with code ${child.exitCode}`)
    try {
      const response = await fetch(url)
      if (response.ok) return
    } catch {
      // not listening yet
    }
    await sleep(150)
  }
  throw new PhaseError(phase, `preview not ready at ${url} within ${timeoutMs}ms`)
}

/** Starts `vite preview` on the built output; `stop()` always reaps the process group. */
export async function startPreview({ cwd, phase = 'preview', log = console.log, timeoutMs = 30_000 }) {
  const port = await freePort()
  const vite = path.join(cwd, 'node_modules/vite/bin/vite.js')
  const child = spawn(process.execPath, [vite, 'preview', '--host', HOST, '--port', String(port), '--strictPort'], {
    cwd,
    detached: true,
    stdio: 'ignore',
  })
  const exited = new Promise((resolve) => child.once('exit', resolve))
  const stop = async () => {
    if (child.exitCode !== null || child.signalCode !== null || child.pid === undefined) return
    for (const signal of ['SIGTERM', 'SIGKILL']) {
      try {
        process.kill(-child.pid, signal)
      } catch {
        return
      }
      if ((await Promise.race([exited.then(() => true), sleep(2_000).then(() => false)])) === true) return
    }
  }
  log(`[preview] vite preview host=${HOST} port=${port}`)
  try {
    const probe = urlFor(port)
    await waitForReady(probe, child, timeoutMs, phase)
    log(`[preview] readiness probe ${probe} ok`)
  } catch (error) {
    await stop()
    throw error
  }
  return { port, url: (pathname) => urlFor(port, pathname), stop }
}
