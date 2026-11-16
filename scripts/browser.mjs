import { spawn } from 'node:child_process'
import { createServer } from 'node:net'
import { setTimeout as delay } from 'node:timers/promises'
import { fileURLToPath } from 'node:url'
import { resolve, dirname } from 'node:path'
import { chromium } from 'playwright'

export const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
export const SETTLE_MS = 850
export async function command(bin, args, cwd = projectRoot) {
  return new Promise((accept, reject) => {
    const proc = spawn(bin, args, { cwd, stdio: ['ignore', 'pipe', 'pipe'] })
    let output = ''
    proc.stdout.on('data', data => { output += data; process.stdout.write(data) })
    proc.stderr.on('data', data => { output += data; process.stderr.write(data) })
    proc.on('error', reject)
    proc.on('exit', code => code === 0 ? accept(output) : reject(new Error(`${bin} ${args.join(' ')} exited ${code}\n${output}`)))
  })
}
export async function startPreview(root = projectRoot) {
  const port = await new Promise((accept, reject) => {
    const socket = createServer()
    socket.on('error', reject)
    socket.listen(0, '127.0.0.1', () => { const port = socket.address().port; socket.close(() => accept(port)) })
  })
  const url = `http://127.0.0.1:${port}`
  const proc = spawn(process.execPath, [resolve(root, 'node_modules/vite/bin/vite.js'), 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] })
  let output = ''
  let spawnError
  proc.on('error', error => { spawnError = error })
  proc.stdout.on('data', data => { output += data })
  proc.stderr.on('data', data => { output += data })
  const stop = async () => {
    if (proc.exitCode !== null || proc.signalCode !== null) return
    await new Promise(accept => { proc.once('exit', accept); proc.kill('SIGTERM'); const timer = setTimeout(() => proc.kill('SIGKILL'), 2000); timer.unref(); proc.once('exit', () => clearTimeout(timer)) })
    console.log(`CLEANUP preview pid=${proc.pid}`)
  }
  try {
    for (let i = 0; i < 100; i++) {
      if (spawnError || proc.exitCode !== null) throw new Error(`Preview failed: ${spawnError ?? output}`)
      try { const response = await fetch(url, { signal: AbortSignal.timeout(500) }); if (response.ok) { console.log(`PREVIEW ${url} pid=${proc.pid}`); return { url, stop } } } catch { /* retry startup */ }
      await delay(100)
    }
    throw new Error(`Preview readiness timed out: ${output}`)
  } catch (error) { await stop(); throw error }
}
export async function withBrowser(root, work, viewport = { width: 1440, height: 900 }) {
  const preview = await startPreview(root)
  let browser
  const stopOnSignal = () => { void browser?.close(); void preview.stop().finally(() => process.exit(130)) }
  process.once('SIGINT', stopOnSignal); process.once('SIGTERM', stopOnSignal)
  try {
    browser = await chromium.launch({ headless: true })
    const page = await browser.newPage({ viewport })
    return await work(page, preview.url)
  } finally {
    await browser?.close(); await preview.stop()
    process.removeListener('SIGINT', stopOnSignal); process.removeListener('SIGTERM', stopOnSignal)
  }
}
export async function assertIndex(page, index) {
  await page.waitForFunction(i => document.querySelector('[data-presentation-root]')?.getAttribute('data-step-index') === String(i), index, { timeout: 3500 })
}
export const isMain = url => process.argv[1] && fileURLToPath(url) === resolve(process.argv[1])
