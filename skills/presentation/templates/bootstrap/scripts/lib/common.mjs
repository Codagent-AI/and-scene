// Shared helpers for verify.mjs and inspect-presentation.mjs.
import { spawn } from 'node:child_process'
import { existsSync, readdirSync, readFileSync, realpathSync } from 'node:fs'
import net from 'node:net'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/** The IPv4 loopback address used for every preview server and browser URL. */
export const HOST = '127.0.0.1'

export const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const DEFAULT_REGISTRY = path.join('src', 'presentations', 'index.ts')
const isRegistrySource = (source) => /\bslug\s*:/.test(source) && /\bload\s*:/.test(source) && /import\(/.test(source)

function sourceFiles(dir) {
  const files = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules') files.push(...sourceFiles(full))
    } else if (/\.(ts|tsx|js|jsx)$/.test(entry.name) && !/\.test\./.test(entry.name)) files.push(full)
  }
  return files
}

/** Source of the presentation registry: src/presentations/index.ts, or whichever file under src/ plays that role. */
export function registrySource(root = projectRoot) {
  try {
    const source = readFileSync(path.join(root, DEFAULT_REGISTRY), 'utf8')
    if (isRegistrySource(source)) return source
  } catch {
    // The registry may carry another name; fall through to the contract-level search.
  }
  const srcDir = path.join(root, 'src')
  const candidates = existsSync(srcDir) ? sourceFiles(srcDir) : []
  for (const file of candidates.sort((a, b) => a.length - b.length || a.localeCompare(b))) {
    const source = readFileSync(file, 'utf8')
    if (isRegistrySource(source)) return source
  }
  throw new Error(`no presentation registry found under src/ (expected ${DEFAULT_REGISTRY})`)
}

/** Slugs of the explicit registry. */
export function registrySlugs(root = projectRoot) {
  return [...registrySource(root).matchAll(/slug:\s*['"]([^'"]+)['"]/g)].map((m) => m[1])
}

/** The registry entry for a slug, including the module its loader imports. */
export function registryEntry(slug, root = projectRoot) {
  const entry = new RegExp(`slug:\\s*['"]${slug}['"][\\s\\S]*?import\\(\\s*['"]([^'"]+)['"]\\s*\\)`).exec(registrySource(root))
  return entry ? { slug, loadPath: entry[1] } : null
}

/** True when this module is the process entry point, also when it was started through a symlinked path. */
export function isMainModule(metaUrl) {
  if (!process.argv[1]) return false
  try {
    return realpathSync(process.argv[1]) === realpathSync(fileURLToPath(metaUrl))
  } catch {
    return false
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

export function run(command, args, { cwd = projectRoot, onData } = {}) {
  return new Promise((resolve) => {
    const child = spawn(command, args, { cwd, stdio: ['ignore', 'pipe', 'pipe'], env: process.env })
    let output = ''
    const collect = (chunk) => {
      output += chunk
      onData?.(String(chunk))
    }
    child.stdout.on('data', collect)
    child.stderr.on('data', collect)
    child.on('error', (error) => resolve({ code: 1, output: `${output}${error.message}` }))
    child.on('close', (code) => resolve({ code: code ?? 1, output }))
  })
}

/** Start `vite preview` on the IPv4 loopback address and wait until it answers. */
export async function startPreview(root = projectRoot) {
  const port = await freePort()
  const viteBin = path.join(root, 'node_modules', 'vite', 'bin', 'vite.js')
  const child = spawn(process.execPath, [viteBin, 'preview', '--host', HOST, '--port', String(port), '--strictPort'], {
    cwd: root,
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  let log = ''
  child.stdout.on('data', (c) => (log += c))
  child.stderr.on('data', (c) => (log += c))
  const exited = new Promise((resolve) => child.once('exit', resolve))
  const origin = `http://${HOST}:${port}`
  const stop = async () => {
    if (child.exitCode === null && child.signalCode === null) {
      child.kill('SIGTERM')
      const timer = setTimeout(() => child.kill('SIGKILL'), 3000)
      await exited
      clearTimeout(timer)
    }
  }
  const deadline = Date.now() + 20000
  for (;;) {
    if (child.exitCode !== null) throw new Error(`preview exited early:\n${log}`)
    try {
      const response = await fetch(`${origin}/`)
      if (response.ok) break
    } catch {
      // not ready yet
    }
    if (Date.now() > deadline) {
      await stop()
      throw new Error(`preview did not become ready at ${origin}:\n${log}`)
    }
    await sleep(100)
  }
  return { origin, port, pid: child.pid, stop }
}

/** Launch Chromium, installing it once if the browser binary is missing. */
export async function launchChromium(chromium) {
  try {
    return await chromium.launch()
  } catch (error) {
    if (!/Executable doesn't exist|playwright install/i.test(String(error))) throw error
    const install = await run(process.execPath, [path.join(projectRoot, 'node_modules', 'playwright', 'cli.js'), 'install', 'chromium'])
    if (install.code !== 0) {
      throw new Error(`Chromium is not installed and "npx playwright install chromium" failed:\n${install.output}`, { cause: error })
    }
    return chromium.launch()
  }
}
