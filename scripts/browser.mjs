import { spawn } from 'node:child_process'
import { createServer } from 'node:net'
import { once } from 'node:events'
import { resolve } from 'node:path'
import { chromium } from 'playwright'
export const HOST = '127.0.0.1'
export const SETTLE_MS = 800
export async function build(cwd = process.cwd()) {
  const child = spawn('npm', ['run', 'build'], { cwd, stdio: 'inherit' })
  const [code] = await once(child, 'exit')
  if (code !== 0) throw new Error(`build: npm run build exited ${code}`)
}
export async function withPreview(cwd, action) {
  const socket = createServer()
  socket.listen(0, HOST); await once(socket, 'listening')
  const port = socket.address().port
  await new Promise(resolve => socket.close(resolve))
  const url = `http://${HOST}:${port}`
  const server = spawn(process.execPath, [resolve(cwd, 'node_modules/vite/bin/vite.js'), 'preview', '--host', HOST, '--port', String(port), '--strictPort'], { cwd, stdio: ['ignore', 'pipe', 'pipe'] })
  let browser, output = ''
  server.stdout.on('data', chunk => { output += chunk })
  server.stderr.on('data', chunk => { output += chunk })
  try {
    const deadline = Date.now() + 15000
    while (true) {
      if (server.exitCode !== null) throw new Error(`preview: exited ${server.exitCode}: ${output}`)
      try { const response = await fetch(url); if (response.ok) break } catch { /* readiness retry */ }
      if (Date.now() > deadline) throw new Error(`preview: readiness timed out at ${url}`)
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    console.log(`preview host/probe: ${url}; pid=${server.pid}`)
    browser = await chromium.launch({ headless: true })
    return await action(browser, url)
  } finally {
    await browser?.close()
    if (server.exitCode === null) {
      const stopped = once(server, 'exit')
      server.kill('SIGTERM')
      const timer = setTimeout(() => server.kill('SIGKILL'), 3000)
      await stopped; clearTimeout(timer)
    }
    console.log(`preview cleaned: pid=${server.pid}`)
  }
}
export function captureErrors(page) {
  const errors = []
  page.on('console', message => { if (message.type() === 'error') errors.push(`console: ${message.text()}`) })
  page.on('pageerror', error => errors.push(`pageerror: ${error.message}`))
  return errors
}
export function assertClean(errors, step) { if (errors.length) throw new Error(`render step ${step}: ${errors.join('; ')}`) }
export async function stepIndex(page, index) {
  try { await page.waitForFunction(i => document.querySelector('[data-presentation]')?.getAttribute('data-step-index') === String(i), index, { timeout: 3000 }) }
  catch { throw new Error(`transition step ${index}: data-step-index did not advance`) }
}
