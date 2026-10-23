import { spawn } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import net from 'node:net'
import path from 'node:path'

/** Always the IPv4 loopback address, so results never depend on name resolution. */
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
  const string = String.raw`(?:"((?:[^"\\]|\\.)*)"|'((?:[^'\\]|\\.)*)')`
  const pattern = new RegExp(String.raw`slug:\s*${string}\s*,\s*title:\s*${string}`, 'gs')
  const unquote = (double, single) =>
    double !== undefined ? JSON.parse(`"${double}"`) : single.replace(/\\(.)/g, '$1')
  const entries = [...source.matchAll(pattern)].map((m) => ({
    slug: unquote(m[1], m[2]),
    title: unquote(m[3], m[4]),
  }))
  // A registry line the parser cannot read must fail loudly rather than skip a presentation.
  const declared = (source.match(/\bslug\s*:\s*['"]/g) ?? []).length
  if (declared !== entries.length) {
    throw new Fail(
      'registry',
      `src/presentations/index.ts has ${declared} slug entries but ${entries.length} could be read; write each entry as { slug: '...', title: '...', load: ... }`,
    )
  }
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

/**
 * Vite's CLI entry as Node resolves it from the app, so a copy hoisted to a workspace root
 * (or any parent node_modules) is found as well as an app-local install.
 */
export function resolveViteBin(root) {
  let manifest
  try {
    manifest = createRequire(path.join(root, 'package.json')).resolve('vite/package.json')
  } catch {
    throw new Fail('preview', `vite is not installed for ${root}; run npm install in the app first`)
  }
  const { bin } = JSON.parse(readFileSync(manifest, 'utf8'))
  return path.join(path.dirname(manifest), typeof bin === 'string' ? bin : bin.vite)
}

/** Starts `vite preview` on 127.0.0.1 and resolves once it answers; `stop()` kills it. */
export async function startPreview(root, { timeoutMs = 30000 } = {}) {
  const port = await freePort()
  const vite = resolveViteBin(root)
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
