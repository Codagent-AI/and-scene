import { spawn } from 'node:child_process'
import { createServer } from 'node:net'
import { once } from 'node:events'
import { setTimeout as delay } from 'node:timers/promises'
import { chromium } from 'playwright'
export const HOST = '127.0.0.1'
export const SETTLE_MS = 850
export function command(bin, args, cwd = process.cwd()) {
  return new Promise((resolve, reject) => {
    const child = spawn(bin, args, { cwd, stdio: 'inherit' })
    child.on('error', reject)
    child.on('exit', code => code === 0 ? resolve() : reject(new Error(`${bin} ${args.join(' ')} failed (${code})`)))
  })
}
async function freePort() {
  const server = createServer(); server.listen(0, HOST); await once(server, 'listening')
  const port = server.address().port
  await new Promise(resolve => server.close(resolve)); return port
}
export async function productionPreview(cwd = process.cwd()) {
  const port = await freePort()
  const url = `http://${HOST}:${port}`
  const child = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', HOST, '--port', String(port), '--strictPort'], { cwd, stdio: ['ignore', 'pipe', 'pipe'] })
  let output = ''; let spawnError
  child.stdout.on('data', data => { output += data })
  child.stderr.on('data', data => { output += data })
  child.on('error', error => { spawnError = error })
  const close = async () => {
    if (child.exitCode !== null || child.signalCode) return
    const exited = once(child, 'exit')
    child.kill('SIGTERM')
    const force = setTimeout(() => child.kill('SIGKILL'), 2000)
    try { await exited } finally { clearTimeout(force) }
  }
  try {
    for (let i = 0; i < 200; i++) {
      if (spawnError) throw spawnError
      if (child.exitCode !== null) throw new Error(`Preview exited: ${output}`)
      try { const response = await fetch(url, { signal: AbortSignal.timeout(500) }); if (response.ok) { console.log(`Preview ready ${url} (pid ${child.pid})`); return { url, close } } } catch { /* retry startup */ }
      await delay(50)
    }
    throw new Error(`Preview readiness failed at ${url}: ${output}`)
  } catch (error) { await close(); throw error }
}
export async function withBrowser(cwd, run) {
  const preview = await productionPreview(cwd)
  let server; let browser
  const stop = () => { void server?.close(); void preview.close() }
  process.once('SIGINT', stop); process.once('SIGTERM', stop)
  try {
    // Own the Chromium process explicitly so cleanup can be verified by PID,
    // rather than mistaking a disconnected client for a terminated browser.
    server = await chromium.launchServer({ headless: true })
    console.log(`Browser ready (pid ${server.process().pid})`)
    browser = await chromium.connect(server.wsEndpoint())
    return await run(browser, preview.url)
  } finally {
    try {
      try { await browser?.close() } finally {
        await server?.close()
        if (server) console.log(`Browser stopped (pid ${server.process().pid})`)
      }
    } finally {
      await preview.close()
      process.removeListener('SIGINT', stop); process.removeListener('SIGTERM', stop)
      console.log(`Preview stopped ${preview.url}`)
    }
  }
}
export function options(args) {
  const result = {}
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) { const key = args[i].slice(2); if (args[i + 1] && !args[i + 1].startsWith('--')) result[key] = args[++i]; else result[key] = true }
    else if (!result.slug) result.slug = args[i]
  }
  return result
}
export async function stepIndex(page, index, timeout = 5000) {
  await page.locator(`[data-presentation][data-step-index="${index}"]`).waitFor({ timeout })
}
