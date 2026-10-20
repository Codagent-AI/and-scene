// Shared helpers for verify.mjs and inspect-presentation.mjs.
import { spawn } from 'node:child_process'
import { readFileSync } from 'node:fs'
import net from 'node:net'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/** The IPv4 loopback address used for every preview server and browser URL. */
export const HOST = '127.0.0.1'

export const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

/** Slugs of the explicit registry in src/presentations/index.ts. */
export function registrySlugs(root = projectRoot) {
  const source = readFileSync(path.join(root, 'src', 'presentations', 'index.ts'), 'utf8')
  return [...source.matchAll(/slug:\s*['"]([^'"]+)['"]/g)].map((m) => m[1])
}

/** The registry entry for a slug, including the module its loader imports. */
export function registryEntry(slug, root = projectRoot) {
  const source = readFileSync(path.join(root, 'src', 'presentations', 'index.ts'), 'utf8')
  const entry = new RegExp(`slug:\\s*['"]${slug}['"][\\s\\S]*?import\\(\\s*['"]([^'"]+)['"]\\s*\\)`).exec(source)
  return entry ? { slug, loadPath: entry[1] } : null
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
