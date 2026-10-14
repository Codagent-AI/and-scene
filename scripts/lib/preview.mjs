// Shared helpers: IPv4-loopback `vite preview` lifecycle and Playwright launching.
import { spawn } from 'node:child_process'
import { createRequire } from 'node:module'
import net from 'node:net'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const HOST = '127.0.0.1'

/** Project root: the parent of the `scripts/` directory this file lives under. */
export function projectRoot() {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
}

export function freePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer()
    server.on('error', reject)
    server.listen(0, HOST, () => {
      const { port } = server.address()
      server.close(() => resolve(port))
    })
  })
}

export function runCommand(cmd, args, { cwd, env } = {}) {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { cwd, env: { ...process.env, ...env }, stdio: ['ignore', 'pipe', 'pipe'] })
    let output = ''
    child.stdout.on('data', (d) => (output += d))
    child.stderr.on('data', (d) => (output += d))
    child.on('error', (err) => resolve({ code: 1, output: output + String(err) }))
    child.on('close', (code) => resolve({ code: code ?? 1, output }))
  })
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/**
 * Start `vite preview` bound to 127.0.0.1 on a free port. Returns
 * `{ url, port, stop }`; `stop()` is idempotent and also runs on exit/signals.
 */
export async function startPreview(root, { port, outDir } = {}) {
  const require = createRequire(path.join(root, 'package.json'))
  const viteBin = path.join(path.dirname(require.resolve('vite/package.json')), 'bin', 'vite.js')
  const chosen = port ?? (Number(process.env.PREVIEW_PORT) || (await freePort()))
  const args = [viteBin, 'preview', '--host', HOST, '--port', String(chosen), '--strictPort']
  if (outDir) args.push('--outDir', outDir)
  const child = spawn(process.execPath, args, { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] })
  let log = ''
  child.stdout.on('data', (d) => (log += d))
  child.stderr.on('data', (d) => (log += d))
  let exited = false
  child.on('exit', () => (exited = true))

  let stopped = false
  const stop = async () => {
    if (stopped) return
    stopped = true
    process.off('exit', onExit)
    for (const sig of ['SIGINT', 'SIGTERM', 'SIGHUP']) process.off(sig, onSignal)
    if (exited) return
    const done = new Promise((r) => child.once('exit', r))
    child.kill('SIGTERM')
    await Promise.race([done, sleep(3000)])
    if (!exited) {
      child.kill('SIGKILL')
      await Promise.race([done, sleep(1000)])
    }
  }
  const onExit = () => {
    if (!exited) child.kill('SIGKILL')
  }
  const onSignal = () => {
    onExit()
    process.exit(130)
  }
  process.on('exit', onExit)
  for (const sig of ['SIGINT', 'SIGTERM', 'SIGHUP']) process.on(sig, onSignal)

  const url = `http://${HOST}:${chosen}`
  const deadline = Date.now() + 30_000
  for (;;) {
    if (exited) {
      await stop()
      throw new Error(`vite preview exited before becoming ready:\n${log}`)
    }
    try {
      const res = await fetch(`${url}/`)
      if (res.ok) break
    } catch {
      /* not ready yet */
    }
    if (Date.now() > deadline) {
      await stop()
      throw new Error(`vite preview was not ready at ${url} within 30s:\n${log}`)
    }
    await sleep(100)
  }
  return { url, port: chosen, stop }
}

export const BROWSER_HELP =
  'Playwright Chromium is not available. Install it with: npx playwright install chromium'

/** Launch Playwright Chromium, or throw an error with install guidance. */
export async function launchChromium() {
  let chromium
  try {
    ;({ chromium } = await import('playwright'))
  } catch {
    throw new Error(`The "playwright" package is not installed. Run: npm ci. ${BROWSER_HELP}`)
  }
  try {
    return await chromium.launch()
  } catch (err) {
    throw new Error(`${BROWSER_HELP}\n${String(err?.message ?? err).split('\n')[0]}`)
  }
}
