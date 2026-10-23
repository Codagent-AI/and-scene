import { spawn } from 'node:child_process'
import net from 'node:net'
import path from 'node:path'

/** Deterministic IPv4 loopback address, so nothing depends on host-name resolution. */
export const HOST = '127.0.0.1'

export const previewUrl = (port, pathname = '/') => `http://${HOST}:${port}${pathname}`

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

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

/** Starts `vite preview` bound to 127.0.0.1 and resolves once it answers. */
export async function startPreview(root, log = console.log) {
  const port = await freePort()
  const vite = path.join(root, 'node_modules', 'vite', 'bin', 'vite.js')
  const args = [vite, 'preview', '--host', HOST, '--port', String(port), '--strictPort']
  log(`preview: vite preview --host ${HOST} --port ${port}`)
  const child = spawn(process.execPath, args, { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] })
  let output = ''
  // keep only the tail: it is only reported when startup fails
  const collect = (d) => (output = (output + d).slice(-8000))
  child.stdout.on('data', collect)
  child.stderr.on('data', collect)
  let exited = false
  child.once('exit', () => (exited = true))

  const stop = async () => {
    if (exited) return
    const done = new Promise((resolve) => child.once('exit', resolve))
    child.kill('SIGTERM')
    const timer = setTimeout(() => child.kill('SIGKILL'), 3000)
    try {
      await done
    } finally {
      clearTimeout(timer)
    }
  }

  const probe = previewUrl(port)
  log(`preview: readiness probe GET ${probe}`)
  const deadline = Date.now() + 30_000
  while (Date.now() < deadline) {
    if (exited) throw new Error(`preview server exited before it was ready:\n${output}`)
    try {
      const response = await fetch(probe)
      if (response.ok) return { port, stop }
    } catch {
      // not listening yet
    }
    await sleep(150)
  }
  await stop()
  throw new Error(`preview server did not become ready at ${probe}:\n${output}`)
}
