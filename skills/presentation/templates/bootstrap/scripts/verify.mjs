import { createServer } from 'node:net'
import { spawn } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'

async function freePort() {
  const probe = createServer()
  await new Promise((resolve, reject) => {
    probe.once('error', reject)
    probe.listen(0, '127.0.0.1', resolve)
  })
  const { port } = probe.address()
  await new Promise((resolve, reject) => probe.close((error) => error ? reject(error) : resolve()))
  return port
}

function previewIsRunning(server, startupError) {
  if (server.exitCode !== null || server.signalCode !== null) {
    throw new Error(`Vite preview exited before becoming ready${startupError() ? `: ${startupError()}` : ''}`)
  }
}

async function stop(server) {
  if (server.exitCode !== null || server.signalCode !== null) return
  const closed = new Promise((resolve) => server.once('close', resolve))
  server.kill('SIGTERM')
  const timeout = setTimeout(() => server.kill('SIGKILL'), 3000)
  await closed
  clearTimeout(timeout)
}

const port = await freePort()
const base = `http://127.0.0.1:${port}`
const vite = fileURLToPath(new URL('../node_modules/vite/bin/vite.js', import.meta.url))
const root = fileURLToPath(new URL('..', import.meta.url))
const server = spawn(process.execPath, [vite, 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { cwd: root, stdio: ['ignore', 'ignore', 'pipe'] })
let browser
let startupOutput = ''
server.stderr.setEncoding('utf8')
server.stderr.on('data', (chunk) => { startupOutput += chunk })
try {
  let ready = false
  for (let attempt = 0; attempt < 60; attempt += 1) {
    previewIsRunning(server, () => startupOutput.trim())
    try { ready = (await fetch(base)).ok; if (ready) break } catch { /* preview is starting */ }
    await delay(250)
  }
  if (!ready) throw new Error(`Vite preview did not become ready on ${base}${startupOutput ? `: ${startupOutput.trim()}` : ''}`)
  browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  const errors = []
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto(`${base}/example`, { waitUntil: 'networkidle' })
  await page.locator('[data-presentation]').waitFor()
  await page.locator('[data-presentation-caption]').waitFor()
  if (errors.length) throw new Error(`Browser errors: ${errors.join('; ')}`)
  console.log('PASS: example route rendered in Chromium without browser errors')
} catch (error) {
  console.error(`FAIL: ${error instanceof Error ? error.message : error}`)
  process.exitCode = 1
} finally {
  await browser?.close()
  await stop(server)
}
