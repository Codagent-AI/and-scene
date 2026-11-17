import { spawn } from 'node:child_process'
import { createServer } from 'node:net'
import { chromium } from 'playwright'
export const HOST = '127.0.0.1'
export const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))
export async function withPreview(work, { cwd = process.cwd() } = {}) {
  const reserve = createServer()
  await new Promise(resolve => reserve.listen(0, HOST, resolve))
  const port = reserve.address().port
  await new Promise(resolve => reserve.close(resolve))
  const url = `http://${HOST}:${port}`
  const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', HOST, '--port', String(port), '--strictPort'], { cwd, stdio: ['ignore', 'pipe', 'pipe'] })
  let output = ''
  server.stdout.on('data', data => { output += data })
  server.stderr.on('data', data => { output += data })
  let browser
  const interrupted = () => {
    process.exitCode = 1
    server.kill('SIGTERM')
    void browser?.close().catch(() => {})
  }
  process.once('SIGINT', interrupted)
  process.once('SIGTERM', interrupted)
  try {
    let ready = false
    for (let i = 0; i < 200; i++) {
      if (server.exitCode !== null) throw new Error(`preview exited: ${output}`)
      try { const response = await fetch(url); if (response.ok) { ready = true; break } } catch { /* wait for bind */ }
      await sleep(50)
    }
    if (!ready) throw new Error(`preview readiness timeout at ${url}: ${output}`)
    console.log(`preview ${url} (readiness and browser host: ${HOST}) pid=${server.pid}`)
    browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] })
    return await work({ browser, url })
  } finally {
    process.removeListener('SIGINT', interrupted)
    process.removeListener('SIGTERM', interrupted)
    try { if (browser) await browser.close() } finally {
    if (server.exitCode === null) {
      const exited = new Promise(resolve => server.once('exit', resolve))
      server.kill('SIGTERM')
      const timer = setTimeout(() => server.kill('SIGKILL'), 3000)
      await exited
      clearTimeout(timer)
    }
    console.log(`preview cleaned pid=${server.pid}`)
    }
  }
}
