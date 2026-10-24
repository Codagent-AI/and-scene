// Shared helpers for verify.mjs and inspect-presentation.mjs: build, registry, preview server.
import { spawn, spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { createServer } from 'node:net'
import { join } from 'node:path'

/** All preview servers and browser URLs use the IPv4 loopback address, never `localhost`. */
export const HOST = '127.0.0.1'

export class PhaseError extends Error {
  constructor(phase, message) {
    super(message)
    this.phase = phase
  }
}

export function readFlag(argv, name) {
  const i = argv.indexOf(name)
  return i === -1 ? undefined : argv[i + 1]
}

export function readRegistrySlugs(root) {
  const file = join(root, 'src', 'presentations', 'index.ts')
  if (!existsSync(file)) throw new PhaseError('registry', 'src/presentations/index.ts is missing')
  const text = readFileSync(file, 'utf8')
  return [...text.matchAll(/slug:\s*['"]([^'"]+)['"]/g)].map((m) => m[1])
}

export function runBuild(root) {
  const result = spawnSync('npm', ['run', 'build'], { cwd: root, encoding: 'utf8', shell: false })
  if (result.status !== 0) {
    const tail = `${result.stdout ?? ''}${result.stderr ?? ''}`.trim().split('\n').slice(-25).join('\n')
    throw new PhaseError('build', `npm run build failed (exit ${result.status})\n${tail}`)
  }
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

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/** Starts `vite preview` on 127.0.0.1 and resolves once it answers; `stop()` always cleans it up. */
export async function startPreview(root) {
  const port = Number(process.env.AND_SCENE_PREVIEW_PORT) || (await freePort())
  const vite = join(root, 'node_modules', 'vite', 'bin', 'vite.js')
  const child = spawn(process.execPath, [vite, 'preview', '--host', HOST, '--port', String(port), '--strictPort'], {
    cwd: root,
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  let log = ''
  child.stdout.on('data', (d) => (log += d))
  child.stderr.on('data', (d) => (log += d))
  let exited = false
  const exitPromise = new Promise((resolve) =>
    child.once('exit', () => {
      exited = true
      resolve()
    }),
  )
  const stop = async () => {
    if (exited) return
    child.kill('SIGTERM')
    await Promise.race([exitPromise, sleep(3000)])
    if (!exited) {
      child.kill('SIGKILL')
      await exitPromise
    }
  }
  const url = `http://${HOST}:${port}`
  try {
    for (let i = 0; i < 150; i++) {
      if (exited) throw new PhaseError('preview', `vite preview exited early\n${log.trim()}`)
      try {
        const res = await fetch(`${url}/`)
        if (res.ok) return { url, port, stop }
      } catch {
        // not listening yet
      }
      await sleep(200)
    }
    throw new PhaseError('preview', `vite preview did not become ready at ${url}\n${log.trim()}`)
  } catch (error) {
    await stop()
    throw error
  }
}

export function reportFailure(error) {
  const phase = error instanceof PhaseError ? error.phase : 'internal'
  const message = error instanceof Error ? error.message : String(error)
  console.error(`FAIL [${phase}] ${message}`)
}
