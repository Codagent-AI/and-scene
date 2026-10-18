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

/** Synchronous last resort for process exit, where no async cleanup can finish. */
export function killGroupSync(pid) {
  try {
    process.kill(-pid, 'SIGKILL')
  } catch {
    /* already gone */
  }
}

/**
 * Runs `stop` at most once, on normal completion and on signals/exit, so the preview
 * subprocess never outlives the command. On a bare process exit only `syncStop` can
 * run. Returns the idempotent stop function; it also removes the listeners it added.
 */
export function installCleanup(stop, proc = process, syncStop = stop) {
  let stopped = null
  const onInt = () => run().finally(() => proc.exit(130))
  const onTerm = () => run().finally(() => proc.exit(143))
  const onExit = () => {
    if (!stopped) {
      stopped = Promise.resolve()
      syncStop()
    }
  }
  const run = () => {
    proc.removeListener('SIGINT', onInt)
    proc.removeListener('SIGTERM', onTerm)
    proc.removeListener('exit', onExit)
    return (stopped ??= Promise.resolve(stop()))
  }
  proc.once('SIGINT', onInt)
  proc.once('SIGTERM', onTerm)
  proc.once('exit', onExit)
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
  const stop = installCleanup(() => killGroup(child.pid), process, () => killGroupSync(child.pid))
  try {
    await waitReady(`${url}/`, child, timeoutMs)
  } catch (error) {
    await stop()
    throw error
  }
  return { url, port: chosen, pid: child.pid, stop }
}
