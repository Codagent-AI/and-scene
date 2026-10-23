import { spawn } from 'node:child_process'
import path from 'node:path'
import { HOST, freePort, previewUrl } from './loopback.mjs'

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function waitReady(url, child, timeoutMs) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`preview server exited with code ${child.exitCode}`)
    try {
      const res = await fetch(url)
      if (res.ok) return
    } catch {
      /* not listening yet */
    }
    await sleep(100)
  }
  throw new Error(`preview server did not become ready at ${url}`)
}

/** Starts `vite preview` on the IPv4 loopback address. Always call `stop()`. */
export async function startPreview(root, { readyTimeoutMs = 20000 } = {}) {
  const port = await freePort()
  const vite = path.join(root, 'node_modules', 'vite', 'bin', 'vite.js')
  const child = spawn(process.execPath, [vite, 'preview', '--host', HOST, '--port', String(port), '--strictPort'], {
    cwd: root,
    detached: true,
    stdio: 'ignore',
  })
  const exited = new Promise((resolve) => child.once('exit', resolve))
  const stop = async () => {
    if (child.exitCode !== null) return
    for (const signal of ['SIGTERM', 'SIGKILL']) {
      try {
        process.kill(-child.pid, signal)
      } catch {
        return
      }
      if ((await Promise.race([exited.then(() => true), sleep(2000).then(() => false)]))) return
    }
  }
  try {
    await waitReady(previewUrl(port), child, readyTimeoutMs)
  } catch (error) {
    await stop()
    throw error
  }
  return { port, pid: child.pid, url: (pathname) => previewUrl(port, pathname), stop }
}
