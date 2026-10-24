import { spawn } from 'node:child_process'
import { createRequire } from 'node:module'
import net from 'node:net'
import path from 'node:path'

/** Deterministic IPv4 loopback; never a hostname, whose IPv4/IPv6 resolution differs between environments. */
export const HOST = '127.0.0.1'

export const baseUrl = (port) => `http://${HOST}:${port}`

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

/** Runs a command to completion and returns its exit code and combined output. */
export function run(command, args, { cwd, env } = {}) {
  return new Promise((resolve) => {
    const child = spawn(command, args, { cwd, env: { ...process.env, ...env }, stdio: ['ignore', 'pipe', 'pipe'] })
    let output = ''
    child.stdout.on('data', (d) => (output += d))
    child.stderr.on('data', (d) => (output += d))
    child.on('error', (error) => resolve({ code: 1, output: `${output}\n${error.message}` }))
    child.on('close', (code) => resolve({ code: code ?? 1, output }))
  })
}

export const tail = (text, lines = 40) => text.trim().split('\n').slice(-lines).join('\n')

/** Starts `vite preview` on the IPv4 loopback address and resolves once it answers a probe. */
export async function startPreview(root, { timeoutMs = 30_000 } = {}) {
  const port = await freePort()
  const require = createRequire(path.join(root, 'package.json'))
  const viteBin = path.join(path.dirname(require.resolve('vite/package.json')), 'bin', 'vite.js')
  const child = spawn(process.execPath, [viteBin, 'preview', '--host', HOST, '--port', String(port), '--strictPort'], {
    cwd: root,
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  let output = ''
  child.stdout.on('data', (d) => (output += d))
  child.stderr.on('data', (d) => (output += d))
  const exited = new Promise((resolve) => child.once('exit', resolve))
  const stop = async () => {
    if (child.exitCode === null && child.signalCode === null) {
      child.kill('SIGTERM')
      const timer = setTimeout(() => child.kill('SIGKILL'), 3000)
      await exited
      clearTimeout(timer)
    }
  }
  const onExit = () => child.kill('SIGKILL')
  process.once('exit', onExit)

  const url = baseUrl(port)
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      process.off('exit', onExit)
      throw new Error(`vite preview exited early:\n${tail(output)}`)
    }
    try {
      const res = await fetch(`${url}/`)
      if (res.ok) return { url, port, stop: async () => { process.off('exit', onExit); await stop() } }
    } catch {
      // not listening yet
    }
    await new Promise((r) => setTimeout(r, 150))
  }
  await stop()
  process.off('exit', onExit)
  throw new Error(`vite preview did not become ready at ${url}:\n${tail(output)}`)
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
