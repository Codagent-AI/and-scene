// Shared plumbing for verify.mjs and inspect-presentation.mjs: project root, loopback
// preview server lifecycle, and child-process cleanup. Everything binds to 127.0.0.1.
import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import net from 'node:net'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export const HOST = '127.0.0.1'

const ANSI = new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, 'g')

/** The project root is derived from this file's location, never from the caller's cwd. */
export const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')

export const sleep = (ms) => new Promise((done) => setTimeout(done, ms))

const children = new Set()

function killGroup(child, signal) {
  try {
    process.kill(-child.pid, signal)
  } catch {
    // already gone
  }
}

/** Stops every process started through this module, escalating to SIGKILL. */
export async function stopAll() {
  const running = [...children]
  for (const child of running) killGroup(child, 'SIGTERM')
  const deadline = Date.now() + 3000
  while (running.some((child) => child.exitCode === null && child.signalCode === null)) {
    if (Date.now() > deadline) {
      for (const child of running) killGroup(child, 'SIGKILL')
      break
    }
    await sleep(50)
  }
  children.clear()
}

export function installSignalCleanup() {
  for (const signal of ['SIGINT', 'SIGTERM']) {
    process.once(signal, () => {
      stopAll().finally(() => process.exit(signal === 'SIGINT' ? 130 : 143))
    })
  }
}

export function freePort() {
  return new Promise((resolvePort, reject) => {
    const server = net.createServer()
    server.once('error', reject)
    server.listen(0, HOST, () => {
      const { port } = server.address()
      server.close(() => resolvePort(port))
    })
  })
}

/** Runs `npm run <script>` in the project root; resolves with { code, output }. */
export function runNpm(script, cwd = projectRoot) {
  return new Promise((done) => {
    const child = spawn('npm', ['run', script], { cwd, stdio: ['ignore', 'pipe', 'pipe'] })
    let output = ''
    child.stdout.on('data', (chunk) => (output += chunk))
    child.stderr.on('data', (chunk) => (output += chunk))
    child.on('error', (error) => done({ code: 1, output: String(error) }))
    child.on('close', (code) => done({ code: code ?? 1, output }))
  })
}

/**
 * Starts `vite preview` on the loopback address and resolves once it answers.
 * Returns the url the server reports for itself and the url used for the readiness probe.
 */
export async function startPreview({ root = projectRoot, port } = {}) {
  const chosen = port ?? Number(process.env.VERIFY_PORT || 0)
  const previewPort = chosen || (await freePort())
  const vite = join(root, 'node_modules', 'vite', 'bin', 'vite.js')
  if (!existsSync(vite)) throw new Error(`vite is not installed under ${root}`)
  const child = spawn(
    process.execPath,
    [vite, 'preview', '--host', HOST, '--port', String(previewPort), '--strictPort'],
    { cwd: root, detached: true, stdio: ['ignore', 'pipe', 'pipe'] },
  )
  children.add(child)
  let output = ''
  child.stdout.on('data', (chunk) => (output += chunk))
  child.stderr.on('data', (chunk) => (output += chunk))
  let exited = false
  child.on('exit', () => (exited = true))

  const probeUrl = `http://${HOST}:${previewPort}/`
  const deadline = Date.now() + 30_000
  for (;;) {
    if (exited) throw new Error(`preview server exited early:\n${output}`)
    if (Date.now() > deadline) throw new Error(`preview server not ready at ${probeUrl}`)
    try {
      const response = await fetch(probeUrl)
      if (response.ok) break
    } catch {
      // not listening yet
    }
    await sleep(100)
  }
  // Vite prints its own "Local:" url a moment after it starts listening.
  const stripAnsi = (text) => text.replace(ANSI, '')
  const urlPattern = /https?:\/\/[^\s/]+:\d+/
  for (let wait = 0; wait < 20 && !urlPattern.test(stripAnsi(output)); wait++) await sleep(100)
  const reported = stripAnsi(output).match(urlPattern)?.[0]
  return { baseUrl: `http://${HOST}:${previewPort}`, probeUrl, boundUrl: reported, port: previewPort }
}

export function normalize(text) {
  return String(text ?? '').replace(/\s+/g, ' ').trim()
}
