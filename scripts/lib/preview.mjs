import { spawn } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import net from 'node:net'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

/** Verification and inspection always use the IPv4 loopback address, never `localhost`. */
export const HOST = '127.0.0.1'

export function projectRoot(importMetaUrl) {
  return path.resolve(path.dirname(new URL(importMetaUrl).pathname), '..')
}

export function registeredSlugs(root) {
  const source = readFileSync(path.join(root, 'src/presentations/index.ts'), 'utf8')
  return [...source.matchAll(/slug:\s*['"]([^'"]+)['"]/g)].map((m) => m[1])
}

export function runBuild(root) {
  return new Promise((resolve) => {
    const child = spawn('npm', ['run', 'build'], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] })
    let output = ''
    child.stdout.on('data', (d) => (output += d))
    child.stderr.on('data', (d) => (output += d))
    child.on('close', (code) => resolve({ ok: code === 0, output }))
  })
}

function freePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer()
    server.once('error', reject)
    server.listen(0, HOST, () => {
      const { port } = server.address()
      server.close(() => resolve(port))
    })
  })
}

async function waitUntilReady(url, child, timeoutMs = 30000) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error('preview server exited before it was ready')
    try {
      const response = await fetch(url)
      if (response.ok) return
    } catch {
      // not listening yet
    }
    await new Promise((r) => setTimeout(r, 150))
  }
  throw new Error(`preview server not ready at ${url}`)
}

/** Start `vite preview` on the IPv4 loopback; the child is killed on stop, exit and signals. */
export async function startPreview(root) {
  const viteDir = path.dirname(createRequire(path.join(root, 'package.json')).resolve('vite/package.json'))
  const port = await freePort()
  const child = spawn(process.execPath, [path.join(viteDir, 'bin/vite.js'), 'preview', '--host', HOST, '--port', String(port), '--strictPort'], {
    cwd: root,
    stdio: 'ignore',
  })
  const stop = () => {
    if (child.exitCode === null) child.kill('SIGKILL')
  }
  process.on('exit', stop)
  for (const signal of ['SIGINT', 'SIGTERM']) {
    process.on(signal, () => {
      stop()
      process.exit(130)
    })
  }
  const origin = `http://${HOST}:${port}`
  try {
    await waitUntilReady(`${origin}/`, child)
  } catch (error) {
    stop()
    throw error
  }
  return { origin, stop }
}

export async function launchBrowser(root) {
  const entry = createRequire(path.join(root, 'package.json')).resolve('playwright')
  const playwright = await import(pathToFileURL(entry).href)
  return (playwright.chromium ?? playwright.default.chromium).launch({ headless: true })
}
