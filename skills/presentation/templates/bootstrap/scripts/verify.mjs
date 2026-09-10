import { createRequire } from 'node:module'
import { spawn } from 'node:child_process'
import { createServer } from 'node:net'
import { chromium } from 'playwright'

const host = '127.0.0.1'

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'inherit', shell: process.platform === 'win32' })
    child.once('error', reject)
    child.once('exit', (code) => code === 0 ? resolve() : reject(new Error(`${command} ${args.join(' ')} exited ${code}`)))
  })
}

function availablePort() {
  return new Promise((resolve, reject) => {
    const server = createServer()
    server.once('error', reject)
    server.listen(0, host, () => {
      const address = server.address()
      server.close((error) => error ? reject(error) : resolve(address.port))
    })
  })
}

async function waitFor(url) {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try { if ((await fetch(url)).ok) return } catch { /* server is still starting */ }
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
  throw new Error(`preview did not become ready at ${url}`)
}

await run('npm', ['run', 'build'])
const port = await availablePort()
const url = `http://${host}:${port}`
const preview = spawn(process.execPath, [createRequire(import.meta.url).resolve('vite/package.json').replace(/package\.json$/, 'bin/vite.js'), 'preview', '--host', host, '--port', String(port), '--strictPort'], { stdio: 'inherit' })

let browser
try {
  await waitFor(url)
  browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  const errors = []
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto(url, { waitUntil: 'networkidle' })
  if (errors.length) throw new Error(`render failed: ${errors.join('; ')}`)
  const routes = await page.locator('[data-presentation-landing] nav a').evaluateAll((links) => links.map((link) => link.getAttribute('href')))
  for (const route of routes) {
    await page.goto(new URL(route, url).href, { waitUntil: 'networkidle' })
    if (errors.length) throw new Error(`render failed at ${route} step 1: ${errors.join('; ')}`)
    const chrome = page.locator('[data-presentation-chrome]')
    await chrome.waitFor()
    const count = Number(await chrome.getAttribute('data-step-count'))
    if (!Number.isInteger(count) || count < 1 || await chrome.getAttribute('data-step-index') !== '0') {
      throw new Error(`render failed at ${route} step 1: missing initial presentation state`)
    }
    if (errors.length) throw new Error(`render failed at ${route} step 1: ${errors.join('; ')}`)
  }
  console.log(`verify: PASS (${routes.length} presentation routes rendered)`)
} catch (error) {
  console.error(`verify: FAIL ${error instanceof Error ? error.message : error}`)
  process.exitCode = 1
} finally {
  await browser?.close()
  preview.kill()
}
