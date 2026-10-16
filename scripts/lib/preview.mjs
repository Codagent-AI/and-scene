import { spawn, spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'
import net from 'node:net'
import path from 'node:path'

export const HOST = '127.0.0.1'

/** Run `npm run build` for `root`; returns whether it succeeded. */
export function buildApp(root) {
  return spawnSync('npm', ['run', 'build'], { cwd: root, stdio: 'inherit' }).status === 0
}

function freePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer()
    srv.once('error', reject)
    srv.listen(0, HOST, () => {
      const { port } = srv.address()
      srv.close(() => resolve(port))
    })
  })
}

async function waitReady(url, child, timeoutMs = 30_000) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`vite preview exited early (code ${child.exitCode})`)
    try {
      const res = await fetch(url)
      if (res.ok) return
    } catch {
      /* not listening yet */
    }
    await new Promise((r) => setTimeout(r, 150))
  }
  throw new Error(`preview did not become ready at ${url}`)
}

/** Start `vite preview` for `root` on the IPv4 loopback; resolves with its origin and a stop function. */
export async function startPreview(root) {
  const require = createRequire(path.join(root, 'package.json'))
  const vite = path.join(path.dirname(require.resolve('vite/package.json')), 'bin', 'vite.js')
  const port = await freePort()
  const child = spawn(process.execPath, [vite, 'preview', '--host', HOST, '--port', String(port), '--strictPort'], {
    cwd: root,
    stdio: ['ignore', 'ignore', 'inherit'],
  })
  const stop = () => {
    if (child.exitCode === null) child.kill('SIGKILL')
  }
  process.once('exit', stop)
  const origin = `http://${HOST}:${port}`
  try {
    await waitReady(`${origin}/`, child)
  } catch (err) {
    stop()
    throw err
  }
  return { origin, stop }
}

export async function loadChromium(root) {
  const require = createRequire(path.join(root, 'package.json'))
  const mod = await import(require.resolve('playwright'))
  return mod.chromium ?? mod.default.chromium
}
