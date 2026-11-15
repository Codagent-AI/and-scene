import { spawn, spawnSync } from 'node:child_process'
import { createServer } from 'node:net'
import { setTimeout as delay } from 'node:timers/promises'
import { chromium } from 'playwright'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
export function build(cwd = process.cwd()) {
  const result = spawnSync('npm', ['run', 'build'], { cwd, stdio: 'inherit', timeout: 120000 })
  if (result.status !== 0) throw new Error('build: whole-application build failed')
}
export async function preview(cwd = process.cwd()) {
  const port = await new Promise((resolve, reject) => { const probe = createServer(); probe.on('error', reject); probe.listen(0, '127.0.0.1', () => { const port = probe.address().port; probe.close(() => resolve(port)) }) })
  const url = `http://127.0.0.1:${port}`
  const child = spawn(process.execPath, [path.join(cwd, 'node_modules/vite/bin/vite.js'), 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { cwd, stdio: ['ignore', 'pipe', 'pipe'] })
  const done = new Promise(resolve => child.once('exit', resolve))
  let output = ''
  child.stdout.on('data', d => { output += d })
  child.stderr.on('data', d => { output += d })
  let spawnError
  child.on('error', error => { spawnError = error })
  const stop = async () => {
    if (child.exitCode !== null) return
    child.kill('SIGTERM')
    await Promise.race([done, delay(2000, undefined, { ref: false })])
    if (child.exitCode === null) { child.kill('SIGKILL'); await done }
  }
  try {
    for (let i = 0; i < 100; i++) {
      if (spawnError || child.exitCode !== null) throw new Error(`preview: failed to start ${spawnError ?? output}`)
      try { if ((await fetch(url, { signal: AbortSignal.timeout(300) })).ok) { console.log(`preview: ${url} pid=${child.pid}`); return { url, stop } } } catch { /* retry until deadline */ }
      await delay(100)
    }
    throw new Error('preview: readiness timeout at 127.0.0.1')
  } catch (error) { await stop(); throw error }
}
export async function withBrowser(cwd, callback, viewport = { width: 1440, height: 900 }) {
  const server = await preview(cwd)
  let browser
  try {
    browser = await chromium.launch({ headless: true })
    const page = await browser.newPage({ viewport })
    page.setDefaultTimeout(7000)
    return await callback(page, server.url)
  } finally { if (browser) await browser.close(); await server.stop(); console.log('cleanup: browser and preview stopped') }
}
export const isMain = url => process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(url)
export function argument(name, fallback) { const index = process.argv.indexOf(name); return index < 0 ? fallback : process.argv[index + 1] }
