import { spawn, spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'
import net from 'node:net'
import path from 'node:path'

/** Every preview, probe, and browser URL uses this IPv4 loopback address. */
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

export const urlFor = (port, pathname = '/') => `http://${HOST}:${port}${pathname}`

async function waitUntilReady(port, child, timeoutMs) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`preview exited early with code ${child.exitCode}`)
    try {
      const response = await fetch(urlFor(port))
      if (response.ok) return
    } catch {
      // not listening yet
    }
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
  throw new Error(`preview did not become ready on ${urlFor(port)} within ${timeoutMs}ms`)
}

/** Closes the browser, then always stops the preview, even when closing the browser rejects. */
export async function teardown({ browser, preview }) {
  try {
    await browser?.close()
  } finally {
    await preview?.stop()
  }
}

/** Starts `vite preview` for the built app in `root`; `stop()` kills its whole process group. */
export async function startPreview(root, { port, timeoutMs = 30000 } = {}) {
  const chosen = port ?? (await freePort())
  const vitePackage = createRequire(path.join(root, 'package.json')).resolve('vite/package.json')
  const viteBin = path.join(path.dirname(vitePackage), 'bin', 'vite.js')
  const child = spawn(process.execPath, [viteBin, 'preview', '--host', HOST, '--port', String(chosen), '--strictPort'], {
    cwd: root,
    detached: true,
    stdio: 'ignore',
  })
  const signalGroup = (signal) => {
    if (process.platform === 'win32') {
      // Windows has no process groups to signal; kill the tree instead.
      spawnSync('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' })
      return
    }
    try {
      process.kill(-child.pid, signal)
    } catch (error) {
      if (error.code !== 'ESRCH') throw error
    }
  }
  /** SIGTERM the preview's process group, then SIGKILL it if it has not exited shortly after. */
  const stop = async () => {
    if (child.pid === undefined || child.exitCode !== null) return
    const exited = new Promise((resolve) => child.once('exit', resolve))
    signalGroup('SIGTERM')
    let timer
    const timeout = new Promise((resolve) => {
      timer = setTimeout(resolve, 2000, 'timeout')
    })
    try {
      if ((await Promise.race([exited, timeout])) === 'timeout') signalGroup('SIGKILL')
    } finally {
      clearTimeout(timer)
    }
  }
  try {
    await waitUntilReady(chosen, child, timeoutMs)
  } catch (error) {
    await stop()
    throw error
  }
  return { port: chosen, url: (pathname) => urlFor(chosen, pathname), stop }
}
