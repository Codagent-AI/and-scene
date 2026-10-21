import { spawn } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import net from 'node:net'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/** All local browser automation uses IPv4 loopback, never `localhost`. */
export const HOST = '127.0.0.1'

/** The project root is the parent of `scripts/`, regardless of the caller's cwd. */
export const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')

export function freePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer()
    server.once('error', reject)
    server.listen(0, HOST, () => {
      const { port } = server.address()
      server.close(() => resolve(port))
    })
  })
}

function run(command, args, options) {
  return new Promise((resolve) => {
    const child = spawn(command, args, { ...options, stdio: ['ignore', 'pipe', 'pipe'] })
    let output = ''
    child.stdout.on('data', (chunk) => (output += chunk))
    child.stderr.on('data', (chunk) => (output += chunk))
    child.on('error', (error) => resolve({ code: 1, output: String(error) }))
    child.on('close', (code) => resolve({ code: code ?? 1, output }))
  })
}

export function runBuild(root = PROJECT_ROOT) {
  return run('npm', ['run', 'build'], { cwd: root })
}

/** Reads `{ slug, title }` pairs from the explicit registry source. */
export async function readRegistry(root = PROJECT_ROOT) {
  const source = await readFile(path.join(root, 'src/presentations/index.ts'), 'utf8')
  const entries = []
  for (const match of source.matchAll(/slug:\s*(['"])(.*?)\1\s*,\s*title:\s*(['"])(.*?)\3/gs)) {
    entries.push({ slug: match[2], title: match[4] })
  }
  return entries
}

/**
 * Starts `vite preview` on the loopback address and resolves once it answers.
 * `stop()` terminates the process and resolves when it has exited.
 */
export async function startPreview(root = PROJECT_ROOT, { timeoutMs = 30000 } = {}) {
  const port = await freePort()
  const vite = path.join(root, 'node_modules/vite/bin/vite.js')
  const child = spawn(
    process.execPath,
    [vite, 'preview', '--host', HOST, '--port', String(port), '--strictPort'],
    { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] },
  )
  let log = ''
  let exited = false
  child.stdout.on('data', (chunk) => (log += chunk))
  child.stderr.on('data', (chunk) => (log += chunk))
  const exit = new Promise((resolve) => child.once('exit', () => ((exited = true), resolve())))
  const stop = async () => {
    if (exited) return
    child.kill('SIGTERM')
    const timer = setTimeout(() => child.kill('SIGKILL'), 3000)
    await exit
    clearTimeout(timer)
  }
  const url = `http://${HOST}:${port}`
  const deadline = Date.now() + timeoutMs
  try {
    for (;;) {
      if (exited) throw new Error(`preview exited early:\n${log}`)
      if (Date.now() > deadline) throw new Error(`preview not ready at ${url}:\n${log}`)
      try {
        const response = await fetch(`${url}/`)
        if (response.ok) break
      } catch {
        /* not listening yet */
      }
      await new Promise((resolve) => setTimeout(resolve, 150))
    }
  } catch (error) {
    await stop()
    throw error
  }
  return { url, port, stop }
}

export async function launchBrowser() {
  const { chromium } = await import('playwright')
  return chromium.launch({ headless: true })
}
