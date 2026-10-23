import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import http from 'node:http'
import net from 'node:net'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'

/** Every server bind, readiness probe and browser URL uses this IPv4 loopback address. */
export const HOST = '127.0.0.1'

export function pickFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer()
    server.once('error', reject)
    server.listen(0, HOST, () => {
      const { port } = server.address()
      server.close(() => resolve(port))
    })
  })
}

export const urlFor = (port, path = '/') => `http://${HOST}:${port}${path}`

function probe(url) {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      res.resume()
      resolve(res.statusCode === 200)
    })
    req.on('error', () => resolve(false))
    req.setTimeout(1000, () => req.destroy())
  })
}

/**
 * @param {string} url
 * @param {{ timeoutMs?: number, pollMs?: number, probeFn?: (url: string) => Promise<boolean>, failed?: () => string | null }} [options]
 */
export async function waitForReady(url, { timeoutMs = 30000, pollMs = 100, probeFn = probe, failed = () => null } = {}) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    const reason = failed()
    if (reason) throw new Error(`preview server exited early: ${reason}`)
    if (await probeFn(url)) return
    await new Promise((r) => setTimeout(r, pollMs))
  }
  throw new Error(`preview server did not become ready at ${url} within ${timeoutMs}ms`)
}

/** Starts `vite preview` (production build) bound to the loopback host. */
export function startPreview(root, port) {
  const viteBin = join(dirname(createRequire(join(root, 'package.json')).resolve('vite/package.json')), 'bin', 'vite.js')
  if (!existsSync(viteBin)) throw new Error(`vite not found at ${viteBin}`)
  const child = spawn(process.execPath, [viteBin, 'preview', '--host', HOST, '--port', String(port), '--strictPort'], {
    cwd: root,
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  let output = ''
  child.stdout.on('data', (d) => (output += d))
  child.stderr.on('data', (d) => (output += d))
  const exited = new Promise((resolve) => child.once('exit', resolve))
  return {
    port,
    failed: () => (child.exitCode !== null ? `code ${child.exitCode}\n${output}` : null),
    async stop() {
      if (child.exitCode !== null) return
      child.kill('SIGTERM')
      const timer = setTimeout(() => child.kill('SIGKILL'), 3000)
      await exited
      clearTimeout(timer)
    },
  }
}

/**
 * Runs `fn(baseUrl, port)` against a ready preview and always stops the preview afterwards.
 * @template T
 * @param {string} root
 * @param {(baseUrl: string, port: number) => Promise<T>} fn
 * @param {{ pick?: () => Promise<number>, start?: (root: string, port: number) => any, ready?: (url: string, options: any) => Promise<void> }} [deps]
 * @returns {Promise<T>}
 */
export async function withPreview(root, fn, deps = {}) {
  const { pick = pickFreePort, start = startPreview, ready = waitForReady } = deps
  const port = await pick()
  const preview = start(root, port)
  try {
    await ready(urlFor(port), { failed: preview.failed })
    return await fn(urlFor(port, ''), port)
  } finally {
    await preview.stop()
  }
}
