// Production preview on the IPv4 loopback address, shared by verify and inspect.
import { spawn } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { createServer } from 'node:net'
import { dirname, join } from 'node:path'

export const HOST = '127.0.0.1'

export function findFreePort() {
  return new Promise((resolve, reject) => {
    const server = createServer()
    server.once('error', reject)
    server.listen(0, HOST, () => {
      const { port } = server.address()
      server.close(() => resolve(port))
    })
  })
}

/** Runs `npm run build` in `root`, resolving with its combined output or rejecting with it. */
export function runBuild(root) {
  return new Promise((resolve, reject) => {
    const child = spawn('npm', ['run', 'build'], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] })
    let output = ''
    child.stdout.on('data', (d) => (output += d))
    child.stderr.on('data', (d) => (output += d))
    child.on('error', (e) => reject(Object.assign(e, { output })))
    child.on('close', (code) => (code === 0 ? resolve(output) : reject(Object.assign(new Error(`npm run build exited with ${code}`), { output }))))
  })
}

function viteBin(root) {
  const pkg = createRequire(join(root, 'package.json')).resolve('vite/package.json')
  const { bin } = JSON.parse(readFileSync(pkg, 'utf8'))
  return join(dirname(pkg), typeof bin === 'string' ? bin : bin.vite)
}

async function waitReady(url, child, timeoutMs, log) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`preview server exited early with code ${child.exitCode}`)
    try {
      log(`probe ${url}`)
      const res = await fetch(url, { signal: AbortSignal.timeout(2000) })
      if (res.ok) return
    } catch {
      /* not ready yet */
    }
    await new Promise((r) => setTimeout(r, 200))
  }
  throw new Error(`preview server not ready at ${url} after ${timeoutMs}ms`)
}

/**
 * Starts `vite preview` bound to 127.0.0.1 and resolves once the probe URL answers.
 * The returned `stop()` terminates exactly the process it started.
 */
export async function startPreview(root, { port, log = () => {}, readyTimeoutMs = 30_000 } = {}) {
  const chosen = port ?? (await findFreePort())
  const args = [viteBin(root), 'preview', '--host', HOST, '--port', String(chosen), '--strictPort']
  log(`preview: vite preview --host ${HOST} --port ${chosen}`)
  const child = spawn(process.execPath, args, { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] })
  let output = ''
  child.stdout.on('data', (d) => (output += d))
  child.stderr.on('data', (d) => (output += d))
  const exited = new Promise((resolve) => child.once('exit', resolve))
  const stop = async () => {
    if (child.exitCode !== null) return
    child.kill('SIGTERM')
    const killer = setTimeout(() => child.kill('SIGKILL'), 3000)
    await exited
    clearTimeout(killer)
  }
  const url = `http://${HOST}:${chosen}`
  try {
    await waitReady(`${url}/`, child, readyTimeoutMs, log)
  } catch (error) {
    await stop()
    throw Object.assign(error, { output })
  }
  return { url, port: chosen, stop }
}
