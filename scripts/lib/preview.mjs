// Shared helpers for verify.mjs and inspect-presentation.mjs: a production
// preview on the IPv4 loopback address and a provisioned Chromium.
import { spawn, spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import net from 'node:net'

export const LOOPBACK = '127.0.0.1'

export const loopbackUrl = (port, path = '/') => `http://${LOOPBACK}:${port}${path}`

export function freePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer()
    server.once('error', reject)
    server.listen(0, LOOPBACK, () => {
      const { port } = server.address()
      server.close(() => resolve(port))
    })
  })
}

/** Decide whether the Chromium executable must be installed before launching. */
export function chromiumInstallPlan(executablePath, exists = existsSync) {
  return executablePath && exists(executablePath) ? { install: false } : { install: true, command: ['npx', 'playwright', 'install', 'chromium'] }
}

export async function ensureChromium(root, log = console.log) {
  const { chromium } = await import('playwright')
  const plan = chromiumInstallPlan(chromium.executablePath())
  if (!plan.install) return chromium
  log('[provision] Chromium missing; running: ' + plan.command.join(' '))
  const result = spawnSync(plan.command[0], plan.command.slice(1), { cwd: root, stdio: 'inherit' })
  if (result.status !== 0) throw new Error('could not install Playwright Chromium (exit ' + result.status + ')')
  return chromium
}

export function launchOptions() {
  return { args: process.getuid?.() === 0 ? ['--no-sandbox'] : [] }
}

/** Start `vite preview` bound to the loopback address and wait until it answers. */
export async function startPreview(root, { port, timeoutMs = 30000, log = console.log } = {}) {
  const chosen = port ?? (await freePort())
  const child = spawn('npx', ['vite', 'preview', '--host', LOOPBACK, '--port', String(chosen), '--strictPort'], {
    cwd: root,
    detached: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  let output = ''
  child.stdout.on('data', (d) => (output += d))
  child.stderr.on('data', (d) => (output += d))
  let exited = false
  child.once('exit', () => (exited = true))
  const baseUrl = loopbackUrl(chosen)
  const deadline = Date.now() + timeoutMs
  log(`[preview] pid ${child.pid} (process group)`)
  log('[preview] waiting for ' + baseUrl)
  while (Date.now() < deadline) {
    if (exited) throw new Error('preview exited early:\n' + output)
    try {
      const res = await fetch(baseUrl)
      if (res.ok) return { child, port: chosen, baseUrl }
    } catch {
      // not listening yet
    }
    await new Promise((r) => setTimeout(r, 150))
  }
  await stopPreview({ child })
  throw new Error('preview did not become ready within ' + timeoutMs + 'ms:\n' + output)
}

/** Terminate the preview's whole process group and wait for it to exit. */
export async function stopPreview(preview) {
  const { child } = preview
  if (child.exitCode !== null || child.signalCode !== null) return
  const done = new Promise((resolve) => child.once('exit', resolve))
  try {
    process.kill(-child.pid, 'SIGTERM')
  } catch {
    child.kill('SIGTERM')
  }
  const timer = setTimeout(() => {
    try {
      process.kill(-child.pid, 'SIGKILL')
    } catch {
      /* already gone */
    }
  }, 3000)
  await done
  clearTimeout(timer)
}

/** Run a command to completion, capturing combined output. Resolves `{ code, output }`. */
export function runCommand(command, args, cwd) {
  return new Promise((resolve) => {
    const child = spawn(command, args, { cwd, stdio: ['ignore', 'pipe', 'pipe'] })
    let output = ''
    child.stdout.on('data', (d) => (output += d))
    child.stderr.on('data', (d) => (output += d))
    child.on('close', (code) => resolve({ code, output }))
  })
}
