// Shared helpers for verify.mjs and inspect-presentation.mjs.
import { spawn } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import net from 'node:net'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/** Deterministic IPv4 loopback so results do not depend on how `localhost` resolves. */
export const HOST = '127.0.0.1'

export const projectRoot = () => path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

/** Slugs of the explicit registry in src/presentations/index.ts, in order. */
export function parseRegistrySlugs(source) {
  return [...source.matchAll(/slug:\s*['"]([^'"]+)['"]/g)].map((m) => m[1])
}

export function readRegistrySlugs(root) {
  const file = path.join(root, 'src/presentations/index.ts')
  return existsSync(file) ? parseRegistrySlugs(readFileSync(file, 'utf8')) : []
}

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

/** Run a command, streaming nothing; resolves with { code, output }. */
export function run(command, args, options = {}) {
  return new Promise((resolve) => {
    const child = spawn(command, args, { ...options, stdio: ['ignore', 'pipe', 'pipe'] })
    let output = ''
    child.stdout.on('data', (d) => (output += d))
    child.stderr.on('data', (d) => (output += d))
    child.on('error', (err) => resolve({ code: 1, output: output + String(err) }))
    child.on('close', (code) => resolve({ code: code ?? 1, output }))
  })
}

export const runBuild = (root) => run(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'build'], { cwd: root })

async function waitForReady(url, child, timeoutMs = 30000) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`vite preview exited early with code ${child.exitCode}`)
    try {
      if ((await fetch(url)).ok) return
    } catch {
      /* not listening yet */
    }
    await new Promise((r) => setTimeout(r, 150))
  }
  throw new Error(`preview at ${url} was not ready within ${timeoutMs}ms`)
}

/**
 * Start `vite preview` on 127.0.0.1 and wait until the readiness probe (same host) answers.
 * The returned `stop()` ends the process and resolves once it has exited.
 */
export async function startPreview(root, port) {
  const bin = path.join(root, 'node_modules/vite/bin/vite.js')
  const child = spawn(process.execPath, [bin, 'preview', '--host', HOST, '--port', String(port), '--strictPort'], {
    cwd: root,
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  const exited = new Promise((resolve) => child.once('exit', resolve))
  const stop = async () => {
    if (child.exitCode === null) {
      child.kill('SIGTERM')
      const timer = setTimeout(() => child.kill('SIGKILL'), 3000)
      await exited
      clearTimeout(timer)
    }
  }
  const baseUrl = `http://${HOST}:${port}`
  try {
    await waitForReady(`${baseUrl}/`, child)
  } catch (err) {
    await stop()
    throw err
  }
  return { baseUrl, stop }
}

/** Run `fn(preview)` against a fresh preview, always stopping it, including on signals. */
export async function withPreview(root, port, fn) {
  const preview = await startPreview(root, port)
  const onSignal = (signal) => {
    preview.stop().finally(() => process.exit(signal === 'SIGINT' ? 130 : 143))
  }
  process.once('SIGINT', onSignal)
  process.once('SIGTERM', onSignal)
  try {
    return await fn(preview)
  } finally {
    process.off('SIGINT', onSignal)
    process.off('SIGTERM', onSignal)
    await preview.stop()
  }
}

export async function resolvePort() {
  return process.env.VERIFY_PORT ? Number(process.env.VERIFY_PORT) : findFreePort()
}
