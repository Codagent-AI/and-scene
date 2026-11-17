import { spawn } from 'node:child_process'
import { createServer } from 'node:net'
import { once } from 'node:events'
import { resolve } from 'node:path'
import { chromium } from 'playwright'
export const HOST = '127.0.0.1'
export const SETTLE_MS = 900
const alive = process => process.exitCode === null && process.signalCode === null
export async function build(cwd = process.cwd()) {
  const child = spawn('npm', ['run', 'build'], { cwd, stdio: 'inherit' })
  const [code] = await once(child, 'exit')
  if (code !== 0) throw new Error(`build phase: npm run build exited ${code}`)
}
export async function withPreview(cwd, action) {
  const socket = createServer()
  socket.listen(0, HOST)
  await once(socket, 'listening')
  const port = socket.address().port
  await new Promise(resolve => socket.close(resolve))
  const url = `http://${HOST}:${port}`
  const server = spawn(process.execPath, [resolve(cwd, 'node_modules/vite/bin/vite.js'), 'preview', '--host', HOST, '--port', String(port), '--strictPort'], { cwd, stdio: ['ignore', 'pipe', 'pipe'] })
  let output = ''
  server.stdout.on('data', data => { output += data })
  server.stderr.on('data', data => { output += data })
  console.log(`preview ${url} pid=${server.pid}`)
  let browser
  let browserServer
  let browserProcess
  try {
    const deadline = Date.now() + 15000
    while (true) {
      if (!alive(server)) throw new Error(`preview phase: exited ${server.signalCode ?? server.exitCode}; ${output}`)
      try { if ((await fetch(url)).ok) break } catch { /* wait for listener */ }
      if (Date.now() > deadline) throw new Error(`preview readiness phase: ${url} ${output}`)
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    browserServer = await chromium.launchServer({ headless: true })
    browserProcess = browserServer.process()
    console.log(`browser pid=${browserProcess.pid}`)
    browser = await chromium.connect(browserServer.wsEndpoint())
    return await action(browser, url)
  } finally {
    try {
      try { await browser?.close() } finally { await browserServer?.close() }
      if (browserProcess) {
        if (alive(browserProcess)) await once(browserProcess, 'exit')
        console.log(`browser cleaned pid=${browserProcess.pid}`)
      }
    } finally {
      if (alive(server)) {
        const stopped = once(server, 'exit')
        server.kill('SIGTERM')
        const kill = setTimeout(() => server.kill('SIGKILL'), 2000)
        await stopped
        clearTimeout(kill)
      }
      console.log(`preview cleaned pid=${server.pid}`)
    }
  }
}
export async function openPresentation(browser, url, slug, viewport = { width: 1440, height: 900 }) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error('route phase: invalid presentation slug')
  const page = await browser.newPage({ viewport })
  const errors = []
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
  page.on('pageerror', error => errors.push(error.message))
  await page.goto(`${url}/${slug}`)
  await page.locator('[data-step-count]').waitFor({ timeout: 8000 })
  const count = Number(await page.locator('[data-step-count]').getAttribute('data-step-count'))
  if (!Number.isInteger(count) || count < 1) throw new Error('render phase step 0: invalid step count')
  return { page, count, errors }
}
export async function waitStep(page, index) {
  try { await page.waitForFunction(index => document.querySelector('[data-step-index]')?.getAttribute('data-step-index') === String(index), index, { timeout: 3000 }) }
  catch { throw new Error(`transition phase step ${index}: step index did not advance`) }
}
export function assertClean(errors, index) {
  if (errors.length) throw new Error(`render phase step ${index}: ${errors.join('; ')}`)
}
