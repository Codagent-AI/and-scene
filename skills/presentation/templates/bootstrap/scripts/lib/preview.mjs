import { spawn } from 'node:child_process'
import path from 'node:path'
import { LOOPBACK_HOST, freePort, originOf, waitForReady } from './loopback.mjs'

/** Serve the production build with `vite preview` on the IPv4 loopback address. */
export async function startPreview(root, { port, timeoutMs } = {}) {
  const chosen = port ?? (await freePort())
  const child = spawn(path.join(root, 'node_modules', '.bin', 'vite'), ['preview', '--host', LOOPBACK_HOST, '--port', String(chosen), '--strictPort'], {
    cwd: root,
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  let output = ''
  child.stdout.on('data', (d) => (output += d))
  child.stderr.on('data', (d) => (output += d))
  const exited = new Promise((resolve) => child.once('exit', resolve))

  const stop = async () => {
    if (child.exitCode !== null || child.signalCode !== null) return
    child.kill('SIGTERM')
    const timer = setTimeout(() => child.kill('SIGKILL'), 3000)
    await exited
    clearTimeout(timer)
  }

  const origin = originOf(chosen)
  try {
    await Promise.race([
      waitForReady(`${origin}/`, { timeoutMs }),
      exited.then(() => {
        throw new Error(`vite preview exited early:\n${output}`)
      }),
    ])
  } catch (err) {
    await stop()
    throw err
  }
  return { origin, stop }
}

export function runBuild(root) {
  return new Promise((resolve) => {
    const child = spawn('npm', ['run', 'build'], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] })
    let output = ''
    child.stdout.on('data', (d) => (output += d))
    child.stderr.on('data', (d) => (output += d))
    child.on('error', (err) => resolve({ ok: false, output: String(err) }))
    child.on('exit', (code) => resolve({ ok: code === 0, output }))
  })
}
