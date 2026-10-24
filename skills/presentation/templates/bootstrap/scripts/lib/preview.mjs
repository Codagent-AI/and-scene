import { spawn } from 'node:child_process'
import net from 'node:net'
import path from 'node:path'

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

export function runBuild(root) {
  return new Promise((resolve) => {
    const child = spawn('npm', ['run', 'build'], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] })
    let output = ''
    child.stdout.on('data', (d) => (output += d))
    child.stderr.on('data', (d) => (output += d))
    child.on('error', (err) => resolve({ code: 1, output: String(err) }))
    child.on('close', (code) => resolve({ code: code ?? 1, output }))
  })
}

async function waitReady(url, child, timeoutMs = 20000) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`preview server exited with code ${child.exitCode}`)
    try {
      const res = await fetch(url)
      if (res.ok) return
    } catch {
      // not listening yet
    }
    await new Promise((r) => setTimeout(r, 100))
  }
  throw new Error(`preview server not ready at ${url}`)
}

/** Starts `vite preview` bound to 127.0.0.1 and resolves once it answers on the same address. */
export async function startPreview(root, port = 0) {
  const chosen = port || (await freePort())
  const vite = path.join(root, 'node_modules', 'vite', 'bin', 'vite.js')
  const child = spawn(
    process.execPath,
    [vite, 'preview', '--host', HOST, '--port', String(chosen), '--strictPort'],
    { cwd: root, stdio: ['ignore', 'ignore', 'pipe'] },
  )
  let stderr = ''
  child.stderr.on('data', (d) => (stderr += d))
  const stop = () =>
    new Promise((resolve) => {
      if (child.exitCode !== null) return resolve()
      child.once('close', () => resolve())
      child.kill('SIGTERM')
    })
  const killNow = () => child.kill('SIGKILL')
  process.once('exit', killNow)
  const url = `http://${HOST}:${chosen}`
  try {
    await waitReady(`${url}/`, child)
  } catch (err) {
    await stop()
    throw new Error(`${err.message}${stderr ? `\n${stderr}` : ''}`)
  }
  return {
    url,
    port: chosen,
    async stop() {
      process.removeListener('exit', killNow)
      await stop()
    },
  }
}

export async function launchChromium() {
  const { chromium } = await import('playwright')
  return chromium.launch()
}

export function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}
