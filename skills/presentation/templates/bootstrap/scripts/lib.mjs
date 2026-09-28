// Shared helpers for verify.mjs and inspect-presentation.mjs.
// Everything binds to the IPv4 loopback so results do not depend on how `localhost` resolves.
import { spawn, spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:net'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

export const HOST = '127.0.0.1'
export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')

/** Slugs registered in src/presentations/index.ts, in registry order. */
export function readRegisteredSlugs(root = ROOT) {
  const source = readFileSync(join(root, 'src/presentations/index.ts'), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')
  return [...source.matchAll(/slug:\s*['"]([^'"]+)['"]/g)].map((m) => m[1])
}

export function runBuild(root = ROOT) {
  const result = spawnSync('npm', ['run', 'build'], { cwd: root, stdio: 'inherit' })
  return result.status === 0
}

function freePort() {
  return new Promise((resolve, reject) => {
    const server = createServer()
    server.once('error', reject)
    server.listen(0, HOST, () => {
      const { port } = server.address()
      server.close(() => resolve(port))
    })
  })
}

/** Starts `vite preview` on 127.0.0.1 and resolves once it answers HTTP. */
export async function startPreview(root = ROOT) {
  const port = await freePort()
  const vite = join(root, 'node_modules/vite/bin/vite.js')
  const child = spawn(process.execPath, [vite, 'preview', '--host', HOST, '--port', String(port), '--strictPort'], {
    cwd: root,
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  let log = ''
  child.stdout.on('data', (d) => (log += d))
  child.stderr.on('data', (d) => (log += d))
  const origin = `http://${HOST}:${port}`
  const deadline = Date.now() + 30_000
  for (;;) {
    if (child.exitCode !== null) throw new Error(`vite preview exited early:\n${log}`)
    try {
      const res = await fetch(`${origin}/`)
      if (res.ok) break
    } catch {
      // not listening yet
    }
    if (Date.now() > deadline) {
      child.kill()
      throw new Error(`vite preview did not become ready at ${origin}:\n${log}`)
    }
    await new Promise((r) => setTimeout(r, 200))
  }
  return { origin, stop: () => child.kill() }
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
