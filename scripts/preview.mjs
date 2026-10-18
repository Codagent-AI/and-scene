import { spawn } from 'node:child_process'
import { createRequire } from 'node:module'
import net from 'node:net'
import path from 'node:path'

/** Preview and browser URLs always use the IPv4 loopback address, so results do not depend on name resolution. */
export const HOST = '127.0.0.1'

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

export async function waitForReady(url, { timeoutMs = 30_000, isAlive = () => true } = {}) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (!isAlive()) throw new Error('preview server exited before it was ready')
    try {
      const response = await fetch(url)
      if (response.ok) return
    } catch {
      // not listening yet
    }
    await new Promise((resolve) => setTimeout(resolve, 150))
  }
  throw new Error(`preview server did not become ready at ${url}`)
}

/** Starts `vite preview` for the project on 127.0.0.1 and resolves once it answers. */
export async function startPreview(root) {
  const require = createRequire(path.join(root, 'package.json'))
  const vitePackage = require.resolve('vite/package.json')
  const viteBin = path.join(path.dirname(vitePackage), 'bin', 'vite.js')
  const port = await freePort()
  const child = spawn(
    process.execPath,
    [viteBin, 'preview', '--host', HOST, '--port', String(port), '--strictPort'],
    { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] },
  )
  let output = ''
  child.stdout.on('data', (chunk) => (output += chunk))
  child.stderr.on('data', (chunk) => (output += chunk))
  let exited = false
  const exit = new Promise((resolve) =>
    child.once('exit', () => {
      exited = true
      resolve()
    }),
  )
  const origin = `http://${HOST}:${port}`
  const stop = async () => {
    if (!exited) child.kill('SIGTERM')
    await exit
  }
  try {
    await waitForReady(`${origin}/`, { isAlive: () => !exited })
  } catch (error) {
    await stop()
    throw new Error(`${error.message}\n${output}`.trim(), { cause: error })
  }
  return { origin, stop }
}
