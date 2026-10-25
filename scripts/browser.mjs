import { spawn } from 'node:child_process'
import { createServer } from 'node:net'
import { once } from 'node:events'
import { resolve } from 'node:path'
import { chromium } from 'playwright'
export const HOST = '127.0.0.1'
export const SETTLE_MS = 850
export async function build(cwd) {
  const child = spawn('npm', ['run', 'build'], { cwd, stdio: 'inherit' })
  const [code] = await once(child, 'exit')
  if (code !== 0) throw new Error(`build: npm run build exited ${code}`)
}
export async function withPreview(cwd, action) {
  const socket = createServer()
  socket.listen(0, HOST)
  await once(socket, 'listening')
  const port = socket.address().port
  await new Promise(resolve => socket.close(resolve))
  const server = spawn(process.execPath, [resolve(cwd, 'node_modules/vite/bin/vite.js'), 'preview', '--host', HOST, '--port', String(port), '--strictPort'], { cwd, stdio: ['ignore', 'pipe', 'pipe'] })
  let output = '', spawnError
  server.on('error', error => { spawnError = error })
  server.stdout.on('data', data => { output += data })
  server.stderr.on('data', data => { output += data })
  const base = `http://${HOST}:${port}`
  let browser
  try {
    let ready = false
    for (let i = 0; i < 100; i++) {
      if (spawnError || server.exitCode !== null) throw new Error(`preview: ${spawnError?.message ?? output}`)
      try { ready = (await fetch(base, { signal: AbortSignal.timeout(500) })).ok } catch { /* startup */ }
      if (ready) break
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    if (!ready) throw new Error(`preview readiness timeout: ${base}; ${output}`)
    console.log(`PREVIEW ${base} PID ${server.pid}; readiness ${base}`)
    browser = await chromium.launch({ headless: true })
    return await action(browser, base)
  } finally {
    if (browser) await browser.close()
    const exited = once(server, 'exit')
    if (server.exitCode === null) {
      server.kill('SIGTERM')
      const force = setTimeout(() => server.kill('SIGKILL'), 3000)
      await exited
      clearTimeout(force)
    }
    console.log(`CLEANUP preview PID ${server.pid}`)
  }
}
export function collectErrors(page) {
  const errors = []
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
  page.on('pageerror', error => errors.push(error.message))
  return () => { if (errors.length) throw new Error(errors.join('; ')) }
}
export async function settle(page, ms = SETTLE_MS) { await page.waitForTimeout(ms) }
export async function assertIndex(page, index) {
  await page.waitForFunction(i => document.querySelector('[data-step-index]')?.getAttribute('data-step-index') === String(i), index, { timeout: 4000 })
}
