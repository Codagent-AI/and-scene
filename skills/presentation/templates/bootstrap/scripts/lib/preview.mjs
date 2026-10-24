import { spawn } from 'node:child_process'
import { createRequire } from 'node:module'
import http from 'node:http'
import net from 'node:net'
import path from 'node:path'

/** Deterministic IPv4 loopback, so nothing depends on how the local hostname resolves. */
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

function probe(url) {
  return new Promise((resolve) => {
    const request = http.get(url, (response) => {
      response.resume()
      resolve(response.statusCode === 200)
    })
    request.on('error', () => resolve(false))
    request.setTimeout(1000, () => {
      request.destroy()
      resolve(false)
    })
  })
}

function killTree(child, signal) {
  try {
    process.kill(-child.pid, signal)
  } catch {
    /* already gone */
  }
}

/** Serves `dist/` with `vite preview` on 127.0.0.1 and resolves once it answers. */
export async function startPreview(root, { timeoutMs = 30000 } = {}) {
  let viteBin
  try {
    viteBin = path.join(path.dirname(createRequire(path.join(root, 'package.json')).resolve('vite/package.json')), 'bin', 'vite.js')
  } catch {
    throw new Error(`vite is not installed for ${root}`)
  }
  const port = await freePort()
  const child = spawn(process.execPath, [viteBin, 'preview', '--host', HOST, '--port', String(port), '--strictPort'], {
    cwd: root,
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: true,
  })
  let output = ''
  child.stdout.on('data', (chunk) => (output += chunk))
  child.stderr.on('data', (chunk) => (output += chunk))
  const exited = new Promise((resolve) => child.once('exit', resolve))
  const onExit = () => killTree(child, 'SIGKILL')
  process.on('exit', onExit)

  const url = `http://${HOST}:${port}`
  const stop = async () => {
    process.off('exit', onExit)
    killTree(child, 'SIGTERM')
    const timer = setTimeout(() => killTree(child, 'SIGKILL'), 3000)
    await exited
    clearTimeout(timer)
  }

  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`preview exited early:\n${output}`)
    if (await probe(`${url}/`)) return { url, port, stop }
    await new Promise((resolve) => setTimeout(resolve, 150))
  }
  await stop()
  throw new Error(`preview did not become ready on ${url}:\n${output}`)
}

/** Runs `cleanup` on SIGINT/SIGTERM before exiting, so previews never outlive the script. */
export function exitOnSignals(cleanup) {
  for (const signal of ['SIGINT', 'SIGTERM']) {
    process.once(signal, () => {
      Promise.resolve(cleanup()).finally(() => process.exit(signal === 'SIGINT' ? 130 : 143))
    })
  }
}

export async function launchBrowser() {
  const { chromium } = await import('playwright')
  return chromium.launch()
}

/** Runs `npm run build` in `root`; rejects with the captured output on failure. */
export function runNpmBuild(root) {
  return new Promise((resolve, reject) => {
    const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm'
    const child = spawn(npm, ['run', 'build'], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] })
    let output = ''
    child.stdout.on('data', (chunk) => (output += chunk))
    child.stderr.on('data', (chunk) => (output += chunk))
    child.on('close', (code) => {
      if (code === 0) resolve()
      else reject(new Error(`npm run build exited with code ${code}\n${output.trim()}`))
    })
  })
}
