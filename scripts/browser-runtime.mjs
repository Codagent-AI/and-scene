import { spawn } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'

export const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm'

export function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'inherit' })
    child.once('error', reject)
    child.once('exit', (code) => code === 0 ? resolve() : reject(new Error(`${command} ${args.join(' ')} exited ${code}`)))
  })
}

export function startPreview(host, port, command = npmCommand) {
  const child = spawn(
    command,
    ['run', 'preview', '--', '--host', host, '--port', String(port), '--strictPort'],
    { detached: process.platform !== 'win32', stdio: 'ignore' },
  )
  const started = new Promise((resolve, reject) => {
    child.once('spawn', resolve)
    child.once('error', reject)
  })
  return { child, started }
}

export async function waitForPreview(url) {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      if ((await fetch(url, { signal: AbortSignal.timeout(500) })).ok) return
    } catch { /* preview is still starting */ }
    await delay(100)
  }
  throw new Error(`Preview did not become ready at ${url}`)
}

function waitForExit(child) {
  if (child.exitCode !== null || child.signalCode !== null) return Promise.resolve()
  return new Promise((resolve) => child.once('close', resolve))
}

async function waitForExitWithin(child, timeoutMs) {
  if (child.exitCode !== null || child.signalCode !== null) return true
  const controller = new AbortController()
  try {
    return await Promise.race([
      waitForExit(child).then(() => true),
      delay(timeoutMs, false, { signal: controller.signal }),
    ])
  } finally {
    controller.abort()
  }
}

async function forceKillWindows(pid) {
  const taskkill = spawn('taskkill', ['/pid', String(pid), '/T', '/F'], { stdio: 'ignore' })
  await new Promise((resolve, reject) => {
    taskkill.once('error', reject)
    taskkill.once('exit', (code) => {
      if (code === 0) resolve()
      else reject(new Error(`taskkill failed for preview process ${pid} with exit code ${code}`))
    })
  })
}

function signalProcessGroup(pid, signal) {
  try {
    process.kill(-pid, signal)
    return true
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ESRCH') return false
    throw error
  }
}

export async function terminatePreview(
  preview,
  { gracefulTimeoutMs = 5_000, forceTimeoutMs = 2_000 } = {},
) {
  if (!preview?.pid) return
  if (process.platform === 'win32') {
    await forceKillWindows(preview.pid)
    if (!await waitForExitWithin(preview, forceTimeoutMs)) {
      throw new Error(`preview process ${preview.pid} did not exit after taskkill`)
    }
    return
  }

  if (!signalProcessGroup(preview.pid, 'SIGTERM')) return
  if (await waitForExitWithin(preview, gracefulTimeoutMs)) return

  if (!signalProcessGroup(preview.pid, 'SIGKILL')) return
  if (!await waitForExitWithin(preview, forceTimeoutMs)) {
    throw new Error(`preview process ${preview.pid} did not exit after SIGKILL`)
  }
}
