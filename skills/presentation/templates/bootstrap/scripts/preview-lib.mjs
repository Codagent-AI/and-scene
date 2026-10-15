// Browser-run plumbing shared by verify.mjs and inspect-presentation.mjs.
import { spawn } from 'node:child_process'
import { realpathSync } from 'node:fs'
import net from 'node:net'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const HOST = '127.0.0.1'

// Preview processes are killed on any exit path, including signals and the overall timeout.
const stoppers = new Set()
process.on('exit', () => stoppers.forEach((stop) => stop()))
for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => process.exit(130))

function freePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer()
    srv.on('error', reject)
    srv.listen(0, HOST, () => {
      const { port } = srv.address()
      srv.close(() => resolve(port))
    })
  })
}

/** Starts `vite preview` on a free port; failures are thrown as `ErrorClass`. */
export async function startPreview(root, ErrorClass) {
  const port = await freePort()
  const vite = path.join(root, 'node_modules', 'vite', 'bin', 'vite.js')
  const child = spawn(process.execPath, [vite, 'preview', '--host', HOST, '--port', String(port), '--strictPort'], {
    cwd: root,
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: true,
  })
  let log = ''
  child.stdout.on('data', (d) => (log += d))
  child.stderr.on('data', (d) => (log += d))
  let exited = false
  child.on('exit', () => (exited = true))
  const stop = () => {
    if (exited) return
    try { process.kill(-child.pid, 'SIGKILL') } catch { /* already gone */ }
  }
  stoppers.add(stop)
  const origin = `http://${HOST}:${port}`
  const deadline = Date.now() + 30000
  for (;;) {
    if (exited) { stop(); throw new ErrorClass(`vite preview exited early\n${log.trim()}`) }
    try {
      if ((await fetch(`${origin}/`)).ok) break
    } catch { /* not ready */ }
    if (Date.now() > deadline) { stop(); throw new ErrorClass(`vite preview not ready at ${origin}\n${log.trim()}`) }
    await new Promise((r) => setTimeout(r, 150))
  }
  return { origin, stop }
}

/** Presses ArrowRight and waits for the root's data-step-index to become `next`; false on timeout. */
export async function advanceTo(page, next) {
  await page.keyboard.press('ArrowRight')
  try {
    await page.waitForFunction(
      (n) => document.querySelector('[data-presentation-root]')?.getAttribute('data-step-index') === String(n),
      next,
      { timeout: 3000 },
    )
    return true
  } catch {
    return false
  }
}

// Treat a script as the entry point unless it was demonstrably imported by another script.
// (An unresolvable argv[1], e.g. `node -`, must run rather than silently exit 0.)
export function isEntryPoint(metaUrl) {
  if (!process.argv[1]) return true
  try {
    return realpathSync(process.argv[1]) === realpathSync(fileURLToPath(metaUrl))
  } catch {
    return true
  }
}
