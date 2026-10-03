import { spawn } from 'node:child_process'
import { createServer } from 'node:net'
import { fileURLToPath } from 'node:url'
import { setTimeout as delay } from 'node:timers/promises'
import { chromium } from 'playwright'

const host = '127.0.0.1'
const getPort = async () => {
  const probe = createServer()
  await new Promise((resolve, reject) => probe.once('error', reject).listen(0, host, resolve))
  const { port } = probe.address()
  await new Promise((resolve, reject) => probe.close((error) => error ? reject(error) : resolve()))
  return port
}
const build = spawn('npm', ['run', 'build'], { stdio: 'inherit', shell: process.platform === 'win32' })
const buildCode = await new Promise((resolve) => build.once('exit', resolve))
if (buildCode !== 0) throw new Error(`Build failed with exit code ${buildCode}`)

const port = await getPort()
const origin = `http://${host}:${port}`
const vite = fileURLToPath(new URL('../node_modules/vite/bin/vite.js', import.meta.url))
const server = spawn(process.execPath, [vite, 'preview', '--host', host, '--port', String(port), '--strictPort'], { stdio: ['ignore', 'pipe', 'pipe'] })
let serverFailure
let serverOutput = ''
server.stdout.on('data', (chunk) => { serverOutput += chunk })
server.stderr.on('data', (chunk) => { serverOutput += chunk })
server.once('error', (error) => { serverFailure = new Error(`Preview failed to start: ${error.message}`) })
server.once('exit', (code, signal) => {
  if (!server.killed) serverFailure = new Error(`Preview exited before verification completed (code ${code}, signal ${signal})`)
})
const assertServerRunning = () => {
  if (serverFailure) throw new Error(`${serverFailure.message}\n${serverOutput}`)
  if (server.exitCode !== null) throw new Error(`Preview exited with code ${server.exitCode}\n${serverOutput}`)
}

let browser
try {
  let ready = false
  for (let attempt = 0; attempt < 50; attempt += 1) {
    assertServerRunning()
    try {
      const response = await fetch(origin)
      assertServerRunning()
      if (response.ok) { ready = true; break }
    } catch (error) {
      assertServerRunning()
      if (attempt === 49) throw error
    }
    await delay(200)
  }
  assertServerRunning()
  if (!ready) throw new Error(`Preview did not become ready at ${origin}\n${serverOutput}`)

  browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
  await page.goto(origin, { waitUntil: 'networkidle' })
  assertServerRunning()
  const routes = await page.locator('a[href^="/"]').evaluateAll((anchors) => [...new Set(anchors.map((anchor) => anchor.getAttribute('href')).filter(Boolean))])
  if (routes.length === 0) throw new Error('Presentation index has no registered presentation routes')
  for (const route of routes) {
    const firstError = errors.length
    await page.goto(new URL(route, origin).href, { waitUntil: 'networkidle' })
    await page.locator('[data-presentation-root]').waitFor()
    assertServerRunning()
    if (errors.length > firstError) throw new Error(`Route ${route} rendered with browser errors: ${errors.slice(firstError).join('; ')}`)
    console.log(`PASS: ${route} rendered cleanly`)
  }
  console.log(`PASS: build and all ${routes.length} registered presentation routes rendered cleanly`)
} catch (error) {
  console.error(`FAIL: ${error.message}`)
  process.exitCode = 1
} finally {
  await browser?.close()
  server.kill('SIGTERM')
}
