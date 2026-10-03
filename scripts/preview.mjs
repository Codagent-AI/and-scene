import { spawn } from 'node:child_process'

const ANSI_ESCAPE = /\u001b\[[0-9;]*m/g
const READY_BANNER = /http:\/\/127\.0\.0\.1:4173(\D|$)/
const STARTUP_TIMEOUT = 15_000
export const PREVIEW_URL = 'http://127.0.0.1:4173/'

// NO_COLOR keeps the banner plain, but vite still colorizes when a parent forces
// it, and escape codes land between the host and the port ("127.0.0.1:<bold>4173").
export function previewStarted(output) { return READY_BANNER.test(output.replace(ANSI_ESCAPE, '')) }

export function run(command, args, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, stdio: 'inherit', shell: process.platform === 'win32' })
    child.on('error', reject)
    child.on('close', (code) => code === 0 ? resolve() : reject(new Error(`${command} ${args.join(' ')} exited with ${code}`)))
  })
}

// Starts `vite preview`, resolves once this process is the one serving, and returns
// `failure` so callers can race it against browser work, plus `stop` for teardown.
export async function startPreview(root) {
  const child = spawn('npm', ['run', 'preview', '--', '--host', '127.0.0.1', '--port', '4173', '--strictPort'], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'], detached: process.platform !== 'win32', shell: process.platform === 'win32', env: { ...process.env, NO_COLOR: '1', FORCE_COLOR: '0' } })
  const monitor = monitorPreview(child)
  const stop = async () => { monitor.dispose(); await terminatePreview(child, root) }
  try {
    await waitForReady(child, monitor.failure)
  } catch (error) {
    monitor.failure.catch(() => {})
    await stop()
    throw error
  }
  return { child, failure: monitor.failure, alive: () => child.exitCode === null && child.signalCode === null, stop }
}

async function waitForReady(child, failure) {
  const deadline = Date.now() + STARTUP_TIMEOUT
  let output = ''
  let started = false
  child.stdout.on('data', (chunk) => { output += chunk.toString(); started ||= previewStarted(output) })
  child.stderr.on('data', (chunk) => { output += chunk.toString() })
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`preview exited before startup: ${output.trim()}`)
    // Only probe once this process announced the port, so a stale server on 4173
    // cannot pass for the build under test.
    if (started) {
      try {
        const response = await fetch(PREVIEW_URL, { signal: AbortSignal.timeout(1000) })
        await response.body?.cancel()
        if (response.ok) return
      } catch {}
    }
    await Promise.race([new Promise((resolve) => setTimeout(resolve, 100)), failure])
  }
  throw new Error(`preview did not start: ${output.trim()}`)
}

function monitorPreview(child) {
  let onError
  let onExit
  const failure = new Promise((_, reject) => {
    onError = (error) => reject(error)
    onExit = (code, signal) => reject(new Error(`preview exited: ${code ?? signal}`))
    child.once('error', onError)
    child.once('exit', onExit)
  })
  return { failure, dispose: () => { child.off('error', onError); child.off('exit', onExit) } }
}

async function terminatePreview(child, root) {
  if (process.platform === 'win32') {
    if (child.pid) await run('taskkill', ['/PID', String(child.pid), '/T', '/F'], root)
    return
  }
  const parentExited = child.exitCode !== null || child.signalCode !== null
  if (child.pid) {
    try { process.kill(-child.pid, 'SIGTERM') } catch (error) { if (error.code !== 'ESRCH') throw error }
  }
  if (parentExited) return
  child.kill('SIGTERM')
  await new Promise((resolve) => child.once('close', resolve))
}
