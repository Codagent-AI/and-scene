import { spawn } from 'node:child_process'
import net from 'node:net'
import { setTimeout as delay } from 'node:timers/promises'
import { chromium } from 'playwright'

const host = '127.0.0.1'
const port = await new Promise((resolve, reject) => {
  const server = net.createServer()
  server.once('error', reject)
  server.listen(0, host, () => {
    const address = server.address()
    server.close(error => error ? reject(error) : resolve(address.port))
  })
})
const baseUrl = `http://${host}:${port}`
let preview
let browser

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'inherit', ...options })
    child.once('error', reject)
    child.once('exit', code => code === 0 ? resolve() : reject(new Error(`${command} exited with code ${code}`)))
  })
}

try {
  await run('npm', ['run', 'build'])
  preview = spawn('npm', ['run', 'preview', '--', '--host', host, '--port', String(port), '--strictPort'], { stdio: 'inherit', detached: true })
  let ready = false
  for (let attempt = 0; attempt < 60; attempt += 1) {
    if (preview.exitCode !== null) throw new Error(`Preview exited with code ${preview.exitCode}`)
    try {
      const response = await fetch(baseUrl)
      if (response.ok) { ready = true; break }
    } catch {}
    await delay(250)
  }
  if (!ready) throw new Error(`Preview did not become ready at ${baseUrl}`)

  browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  const errors = []
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
  page.on('pageerror', error => errors.push(error.message))
  if (!process.argv[2]) throw new Error('Pass a registered presentation slug: npm run verify -- <slug>')
  const route = `/${process.argv[2]}`
  await page.goto(`${baseUrl}${route}`, { waitUntil: 'networkidle' })
  await page.locator('body').waitFor({ state: 'visible' })
  const presentation = page.locator('[data-step-count]').first()
  await presentation.waitFor({ state: 'visible' })
  const total = Number(await presentation.getAttribute('data-step-count'))
  if (!Number.isInteger(total) || total < 1) throw new Error(`No presentation steps found at ${route}`)
  for (let index = 0; index < total; index += 1) {
    const actual = Number(await page.locator('[data-step-index]').first().getAttribute('data-step-index'))
    if (actual !== index) throw new Error(`Render check failed at step ${index}: observed index ${actual}`)
    if (index < total - 1) {
      await page.keyboard.press('ArrowRight')
      await page.waitForFunction(expected => Number(document.querySelector('[data-step-index]')?.getAttribute('data-step-index')) === expected, index + 1)
    }
  }
  if (errors.length) throw new Error(`Browser errors at ${route}: ${errors.join('; ')}`)
  console.log(`PASS: build and browser render check (${route}, ${total} steps)`)
} catch (error) {
  console.error(`FAIL: ${error instanceof Error ? error.message : error}`)
  process.exitCode = 1
} finally {
  await browser?.close()
  if (preview?.pid) {
    try { process.kill(-preview.pid, 'SIGTERM') } catch {}
  }
}
