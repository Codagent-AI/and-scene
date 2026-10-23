import { spawn } from 'node:child_process'
import { readFileSync } from 'node:fs'
import net from 'node:net'
import path from 'node:path'

/** Always IPv4 loopback so results do not depend on how `localhost` resolves. */
export const HOST = '127.0.0.1'

export class Fail extends Error {
  constructor(phase, message) {
    super(message)
    this.phase = phase
  }
}

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

/** Slugs and titles from the explicit registry in src/presentations/index.ts. */
export function readRegistry(root) {
  const source = readFileSync(path.join(root, 'src/presentations/index.ts'), 'utf8')
  const entries = []
  const pattern = /slug:\s*(['"])(.*?)\1\s*,\s*title:\s*(['"])(.*?)\3/gs
  for (const match of source.matchAll(pattern)) entries.push({ slug: match[2], title: match[4] })
  return entries
}

export function runBuild(root) {
  return new Promise((resolve) => {
    const child = spawn('npm', ['run', 'build'], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] })
    let output = ''
    child.stdout.on('data', (chunk) => (output += chunk))
    child.stderr.on('data', (chunk) => (output += chunk))
    child.on('error', (error) => resolve({ code: 1, output: String(error) }))
    child.on('close', (code) => resolve({ code, output }))
  })
}

/** Starts `vite preview` on 127.0.0.1 and resolves once it answers; `stop()` kills it. */
export async function startPreview(root, { timeoutMs = 30000 } = {}) {
  const port = await freePort()
  const vite = path.join(root, 'node_modules/vite/bin/vite.js')
  const child = spawn(
    process.execPath,
    [vite, 'preview', '--host', HOST, '--port', String(port), '--strictPort'],
    { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] },
  )
  let log = ''
  child.stdout.on('data', (chunk) => (log += chunk))
  child.stderr.on('data', (chunk) => (log += chunk))
  const exited = new Promise((resolve) => child.once('exit', resolve))
  const stop = async () => {
    if (child.exitCode === null && child.signalCode === null) child.kill('SIGTERM')
    await exited
  }
  const url = `http://${HOST}:${port}`
  const deadline = Date.now() + timeoutMs
  for (;;) {
    if (child.exitCode !== null) throw new Fail('preview', `vite preview exited early:\n${log}`)
    try {
      const response = await fetch(`${url}/`)
      if (response.ok) return { url, port, stop }
    } catch {
      /* not listening yet */
    }
    if (Date.now() > deadline) {
      await stop()
      throw new Fail('preview', `preview did not answer at ${url} within ${timeoutMs}ms\n${log}`)
    }
    await new Promise((resolve) => setTimeout(resolve, 150))
  }
}
