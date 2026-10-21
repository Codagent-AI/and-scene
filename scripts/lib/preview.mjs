// Shared plumbing for verify.mjs and inspect-presentation.mjs: run npm scripts,
// serve the production build on the IPv4 loopback, and always clean up.
import { spawn } from 'node:child_process'
import { createServer } from 'node:net'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

export const HOST = '127.0.0.1'

export const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** Slugs are route names and file names: lowercase letters, digits and hyphens. */
export const isValidSlug = (slug) => typeof slug === 'string' && /^[a-z0-9][a-z0-9-]*$/.test(slug)

/** A phase failure carries the phase name so the report says what failed. */
export class PhaseError extends Error {
  constructor(phase, message) {
    super(message)
    this.phase = phase
  }
}

export function previewArgs(port) {
  return ['preview', '--host', HOST, '--port', String(port), '--strictPort']
}

export const previewUrl = (port, path = '/') => `http://${HOST}:${port}${path}`

export function findFreePort() {
  return new Promise((resolve, reject) => {
    const server = createServer()
    server.once('error', reject)
    server.listen(0, HOST, () => {
      const { port } = server.address()
      server.close(() => resolve(port))
    })
  })
}

export function runCommand(command, args, { cwd, phase }) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, stdio: ['ignore', 'pipe', 'pipe'], shell: false })
    let output = ''
    child.stdout.on('data', (chunk) => (output += chunk))
    child.stderr.on('data', (chunk) => (output += chunk))
    child.once('error', (error) => reject(new PhaseError(phase, `${command} failed to start: ${error.message}`)))
    child.once('close', (code) => {
      if (code === 0) resolve(output)
      else reject(new PhaseError(phase, `${command} ${args.join(' ')} exited with ${code}\n${output.trim()}`))
    })
  })
}

export const runBuild = (root) =>
  runCommand(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'build'], { cwd: root, phase: 'build' })

export async function waitForHttp(url, { timeoutMs = 30000, intervalMs = 150, fetchImpl = fetch } = {}) {
  const deadline = Date.now() + timeoutMs
  let lastError = 'no response'
  while (Date.now() < deadline) {
    try {
      const response = await fetchImpl(url)
      if (response.ok) return
      lastError = `HTTP ${response.status}`
    } catch (error) {
      lastError = error.message
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs))
  }
  throw new PhaseError('preview', `preview at ${url} was not ready: ${lastError}`)
}

/** Stop a child and wait until it has exited, escalating to SIGKILL. */
export async function stopProcess(child, graceMs = 3000) {
  if (!child || child.exitCode !== null || child.signalCode !== null) return
  const exited = new Promise((resolve) => child.once('exit', resolve))
  child.kill('SIGTERM')
  const timer = setTimeout(() => child.kill('SIGKILL'), graceMs)
  await exited
  clearTimeout(timer)
}

export async function startPreview(root) {
  const vite = join(root, 'node_modules', 'vite', 'bin', 'vite.js')
  if (!existsSync(vite)) throw new PhaseError('preview', `vite is not installed at ${vite}; run npm ci`)
  const port = await findFreePort()
  const child = spawn(process.execPath, [vite, ...previewArgs(port)], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] })
  let log = ''
  child.stdout.on('data', (chunk) => (log += chunk))
  child.stderr.on('data', (chunk) => (log += chunk))
  const early = new Promise((_, reject) =>
    child.once('exit', (code) => reject(new PhaseError('preview', `vite preview exited early (${code})\n${log.trim()}`))),
  )
  try {
    await Promise.race([waitForHttp(previewUrl(port)), early])
  } catch (error) {
    await stopProcess(child)
    throw error
  }
  return { port, child, stop: () => stopProcess(child) }
}

export const launchChromium = async () => (await import('playwright')).chromium.launch()

/** Real collaborators; tests and callers can substitute any of them. */
export const defaultDeps = { runBuild, startPreview, launchBrowser: launchChromium }
