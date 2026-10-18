import { spawn } from 'node:child_process'
import net from 'node:net'
import path from 'node:path'

/** Every URL in the verification flow uses this IPv4 loopback address, so results never depend on name resolution. */
export const HOST = '127.0.0.1'

export function findFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer()
    server.once('error', reject)
    server.listen(0, HOST, () => {
      const { port } = server.address()
      server.close(() => resolve(port))
    })
  })
}

export function isPidAlive(pid) {
  try {
    process.kill(pid, 0)
    return true
  } catch {
    return false
  }
}

/** Kills a detached process group: SIGTERM first, SIGKILL if it lingers. */
export async function killGroup(pid, { graceMs = 1500 } = {}) {
  const signal = (sig) => {
    try {
      process.kill(-pid, sig)
    } catch {
      /* already gone */
    }
  }
  signal('SIGTERM')
  const deadline = Date.now() + graceMs
  while (isPidAlive(pid) && Date.now() < deadline) await new Promise((r) => setTimeout(r, 50))
  if (isPidAlive(pid)) signal('SIGKILL')
}

/**
 * Runs `stop` at most once, on normal completion and on signals/exit, so the preview
 * subprocess never outlives the command. Returns the idempotent stop function.
 */
export function installCleanup(stop, proc = process) {
  let stopped = null
  const run = () => (stopped ??= Promise.resolve(stop()))
  const onSignal = (sig) => () => {
    run().finally(() => proc.exit(sig === 'SIGINT' ? 130 : 143))
  }
  proc.once('SIGINT', onSignal('SIGINT'))
  proc.once('SIGTERM', onSignal('SIGTERM'))
  proc.once('exit', () => {
    // Synchronous last resort; the async path above normally already ran.
    if (!stopped) void run()
  })
  return run
}

async function waitReady(url, child, timeoutMs) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`vite preview exited with code ${child.exitCode}`)
    try {
      const res = await fetch(url)
      if (res.ok) return
    } catch {
      /* not listening yet */
    }
    await new Promise((r) => setTimeout(r, 150))
  }
  throw new Error(`preview did not become ready at ${url}`)
}

/** Starts `vite preview` bound to 127.0.0.1 and resolves once it answers HTTP. */
export async function startPreview(root, { port, timeoutMs = 20000 } = {}) {
  const chosen = port ?? (await findFreePort())
  const vite = path.join(root, 'node_modules', 'vite', 'bin', 'vite.js')
  const child = spawn(
    process.execPath,
    [vite, 'preview', '--host', HOST, '--port', String(chosen), '--strictPort'],
    { cwd: root, detached: true, stdio: 'ignore' },
  )
  const url = `http://${HOST}:${chosen}`
  const stop = installCleanup(() => killGroup(child.pid))
  try {
    await waitReady(`${url}/`, child, timeoutMs)
  } catch (error) {
    await stop()
    throw error
  }
  return { url, port: chosen, pid: child.pid, stop }
}
