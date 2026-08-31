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

export function startPreview(host, port) {
  return spawn(
    npmCommand,
    ['run', 'preview', '--', '--host', host, '--port', String(port), '--strictPort'],
    { detached: process.platform !== 'win32', stdio: 'ignore' },
  )
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

export async function terminatePreview(preview) {
  if (!preview?.pid) return
  if (process.platform === 'win32') {
    const taskkill = spawn('taskkill', ['/pid', String(preview.pid), '/T', '/F'], { stdio: 'ignore' })
    await new Promise((resolve) => taskkill.once('close', resolve))
  } else {
    try {
      process.kill(-preview.pid, 'SIGTERM')
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error && error.code !== 'ESRCH') throw error
    }
  }
  await waitForExit(preview)
}
