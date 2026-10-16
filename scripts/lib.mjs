// Shared helpers for verify.mjs and inspect-presentation.mjs (kept byte-aligned with the bootstrap template).
import { spawn, spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import net from 'node:net'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const HOST = '127.0.0.1'
export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

export function readRegistry() {
  const file = ['ts', 'tsx'].map((e) => path.join(ROOT, `src/presentations/index.${e}`)).find(existsSync)
  if (!file) throw new Error('no presentation index found at src/presentations/index.ts(x)')
  const src = readFileSync(file, 'utf8')
  return [...src.matchAll(/slug:\s*['"]([^'"]+)['"]/g)].map((m) => m[1])
}

export function runBuild() {
  const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm'
  return spawnSync(npm, ['run', 'build'], { cwd: ROOT, encoding: 'utf8' })
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

async function waitForServer(port, child, timeoutMs = 20000) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error('vite preview exited before it was ready')
    try {
      const res = await fetch(`http://${HOST}:${port}/`)
      if (res.ok) return
    } catch {
      /* not ready yet */
    }
    await new Promise((r) => setTimeout(r, 150))
  }
  throw new Error(`vite preview was not ready on ${HOST}:${port} within ${timeoutMs}ms`)
}

/** Start `vite preview` on the IPv4 loopback; resolves `{ base, stop }`. */
export async function startPreview() {
  const port = await freePort()
  const bin = path.join(ROOT, 'node_modules/vite/bin/vite.js')
  const child = spawn(process.execPath, [bin, 'preview', '--host', HOST, '--port', String(port), '--strictPort'], {
    cwd: ROOT,
    stdio: 'ignore',
    detached: process.platform !== 'win32',
  })
  const stop = () => {
    if (child.exitCode !== null) return
    try {
      if (process.platform === 'win32') child.kill()
      else process.kill(-child.pid, 'SIGTERM')
    } catch {
      /* already gone */
    }
  }
  process.once('exit', stop)
  try {
    await waitForServer(port, child)
  } catch (err) {
    stop()
    throw err
  }
  return { base: `http://${HOST}:${port}`, stop }
}

export const STEP_HOOK = '[data-presentation-root]'

export async function stepIndex(page) {
  return Number(await page.getAttribute(STEP_HOOK, 'data-step-index'))
}

export async function stepCount(page) {
  return Number(await page.getAttribute(STEP_HOOK, 'data-step-count'))
}

/** Press ArrowRight and wait until `data-step-index` reaches `to`. */
export async function advance(page, to) {
  await page.keyboard.press('ArrowRight')
  await page.waitForFunction(
    ([sel, want]) => Number(document.querySelector(sel)?.getAttribute('data-step-index')) === want,
    [STEP_HOOK, to],
    { timeout: 3000 },
  )
}

/**
 * Wait for the step's normal entrance lifecycle: entering elements fully visible and no
 * running animations, then a short grace period so timers scheduled by the entrance fire.
 * Returns false when animations were still running at the timeout.
 */
export async function waitSettled(page, timeoutMs = 6000, graceMs = 250) {
  const settled = await page
    .waitForFunction(
      () =>
        [...document.querySelectorAll('[data-presentation-appear]')].every((el) => Number(getComputedStyle(el).opacity) >= 0.999) &&
        document.getAnimations().every((a) => a.playState !== 'running'),
      undefined,
      { timeout: timeoutMs },
    )
    .then(() => true, () => false)
  await page.waitForTimeout(graceMs)
  return settled
}
