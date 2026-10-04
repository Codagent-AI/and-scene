import { spawn } from 'node:child_process'
import { createServer } from 'node:net'
import path from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { chromium } from 'playwright'

const slug = process.argv[2]
if (!slug) {
  console.error('Usage: npm run verify -- <presentation-slug>')
  process.exit(2)
}

const run = (command, args) => new Promise((resolve, reject) => {
  const child = spawn(command, args, { stdio: 'inherit', shell: process.platform === 'win32' })
  child.once('error', reject)
  child.once('exit', (code) => code === 0 ? resolve() : reject(new Error(`${command} ${args.join(' ')} exited ${code}`)))
})
const reservePort = () => new Promise((resolve, reject) => {
  const socket = createServer()
  socket.once('error', reject)
  socket.listen(0, '127.0.0.1', () => {
    const address = socket.address()
    if (!address || typeof address === 'string') return reject(new Error('could not reserve an IPv4 preview port'))
    socket.close((error) => error ? reject(error) : resolve(address.port))
  })
})

let server
let browser
let activeStep = 'initial route'
try {
  await run('npm', ['run', 'build'])
  const port = await reservePort()
  let startupError
  let startupOutput = ''
  server = spawn(process.execPath, [path.resolve('node_modules/vite/bin/vite.js'), 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { stdio: ['ignore', 'ignore', 'pipe'] })
  server.on('error', (error) => { startupError = error })
  server.stderr.setEncoding('utf8').on('data', (chunk) => { startupOutput += chunk })
  const url = `http://127.0.0.1:${port}`
  let ready = false
  for (let attempt = 0; attempt < 60; attempt++) {
    if (startupError || server.exitCode !== null) throw new Error(`preview failed to start: ${startupError?.message ?? startupOutput}`)
    try { if ((await fetch(url)).ok) { ready = true; break } } catch {}
    await delay(250)
  }
  if (!ready) throw new Error(`preview did not become ready at ${url}: ${startupOutput}`)
  browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  const browserErrors = []
  page.on('console', (message) => { if (message.type() === 'error') browserErrors.push(`[${activeStep}] console error: ${message.text()}`) })
  page.on('pageerror', (error) => browserErrors.push(`[${activeStep}] page error: ${error.message}`))
  await page.goto(`${url}/${encodeURIComponent(slug)}`, { waitUntil: 'networkidle' })
  const root = page.locator('[data-step-count]')
  const count = Number(await root.getAttribute('data-step-count'))
  if (!Number.isInteger(count) || count < 1) throw new Error(`route /${slug} did not expose a positive data-step-count`)
  const awaitIndex = async (expected) => {
    try {
      await page.waitForFunction((value) => Number(document.querySelector('[data-step-index]')?.getAttribute('data-step-index')) === value, expected)
    } catch (error) {
      throw new Error(`failed to reach step ${expected + 1}/${count}: ${error.message}`)
    }
  }
  for (let index = 0; index < count; index++) {
    activeStep = `step ${index + 1}/${count}`
    await awaitIndex(index)
    if (browserErrors.length) throw new Error(browserErrors.join('\n'))
    if (index + 1 < count) {
      await page.keyboard.press('ArrowRight')
      activeStep = `step ${index + 2}/${count}`
      await awaitIndex(index + 1)
    }
  }
  if (browserErrors.length) throw new Error(browserErrors.join('\n'))
  await page.close()
  console.log(`PASS: /${slug} rendered ${count} steps on ${url}`)
} catch (error) {
  console.error(`FAIL during ${activeStep}: ${error.message}`)
  process.exitCode = 1
} finally {
  await browser?.close()
  if (server && server.exitCode === null) { server.kill('SIGTERM'); await delay(200) }
}
