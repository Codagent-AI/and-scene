import { spawn } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { createServer } from 'node:net'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/** Deterministic IPv4 loopback so runs never depend on hostname resolution. */
export const HOST = '127.0.0.1'

export function projectRoot(metaUrl) {
  return path.resolve(path.dirname(fileURLToPath(metaUrl)), '..')
}

export class PhaseError extends Error {
  constructor(phase, message) {
    super(message)
    this.phase = phase
  }
}

export function freePort() {
  return new Promise((resolve, reject) => {
    const server = createServer()
    server.once('error', reject)
    server.listen(0, HOST, () => {
      const { port } = server.address()
      server.close(() => resolve(port))
    })
  })
}

/** Top-level object literals of the first array in `source`, found by brace matching. */
function arrayObjects(source) {
  const declaration = /presentations[^=]*=\s*\[/.exec(source)
  if (!declaration) return []
  const start = declaration.index + declaration[0].length - 1
  const objects = []
  let depth = 0
  let from = -1
  let quote = null
  for (let i = start + 1; i < source.length; i++) {
    const ch = source[i]
    if (quote) {
      if (ch === '\\') i++
      else if (ch === quote) quote = null
    } else if (ch === "'" || ch === '"' || ch === '`') quote = ch
    else if (ch === '{') {
      if (depth++ === 0) from = i
    } else if (ch === '}') {
      if (--depth === 0) objects.push(source.slice(from, i + 1))
    } else if (ch === ']' && depth === 0) break
  }
  return objects
}

/** Registered presentations, read from the explicit registry source (property order does not matter). */
export function readRegistry(root) {
  const source = readFileSync(path.join(root, 'src/presentations/index.ts'), 'utf8')
  const entries = []
  for (const object of arrayObjects(source)) {
    const slug = /\bslug:\s*(['"])(.+?)\1/.exec(object)
    const title = /\btitle:\s*(['"])(.+?)\1/.exec(object)
    if (slug && title) entries.push({ slug: slug[2], title: title[2] })
  }
  return entries
}

export function run(command, args, options = {}) {
  return new Promise((resolve) => {
    const child = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'], ...options })
    let output = ''
    child.stdout.on('data', (chunk) => (output += chunk))
    child.stderr.on('data', (chunk) => (output += chunk))
    child.on('error', (error) => resolve({ code: 1, output: output + String(error) }))
    child.on('close', (code) => resolve({ code: code ?? 1, output }))
  })
}

export function runBuild(root) {
  return run('npm', ['run', 'build'], { cwd: root })
}

/** Starts `vite preview` on the loopback host and waits until it answers. */
export async function startPreview(root, log = () => {}) {
  const require = createRequire(path.join(root, 'package.json'))
  const viteBin = path.join(path.dirname(require.resolve('vite/package.json')), 'bin/vite.js')
  const port = await freePort()
  const base = `http://${HOST}:${port}`
  const child = spawn(
    process.execPath,
    [viteBin, 'preview', '--host', HOST, '--port', String(port), '--strictPort'],
    { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] },
  )
  let output = ''
  child.stdout.on('data', (chunk) => (output += chunk))
  child.stderr.on('data', (chunk) => (output += chunk))
  let exited = false
  const exit = new Promise((resolve) => {
    child.on('exit', () => {
      exited = true
      resolve()
    })
  })
  const stop = async () => {
    if (!exited) {
      child.kill('SIGTERM')
      const timer = setTimeout(() => child.kill('SIGKILL'), 3000)
      await exit
      clearTimeout(timer)
    }
  }
  log(`preview listening on ${base}`)
  log(`readiness probe ${base}/`)
  const deadline = Date.now() + 30_000
  for (;;) {
    if (exited) throw new PhaseError('preview', `preview exited early:\n${output.trim()}`)
    try {
      const response = await fetch(`${base}/`, { signal: AbortSignal.timeout(2000) })
      if (response.ok) break
    } catch {
      // not listening yet
    }
    if (Date.now() > deadline) {
      await stop()
      throw new PhaseError('preview', 'preview did not become ready within 30s')
    }
    await new Promise((resolve) => setTimeout(resolve, 150))
  }
  return { base, stop, pid: child.pid }
}

/** Resolves once the public `data-step-index` hook reads `index`; rejects after the timeout. */
export function waitForStepIndex(page, index, timeout = 5000) {
  return page.waitForFunction(
    (i) => document.querySelector('[data-step-index]')?.getAttribute('data-step-index') === String(i),
    index,
    { timeout },
  )
}
