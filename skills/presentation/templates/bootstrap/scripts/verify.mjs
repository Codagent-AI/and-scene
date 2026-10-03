import { readFile } from 'node:fs/promises'
import { createServer } from 'node:net'
import { spawn } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const appRoot = fileURLToPath(new URL('../', import.meta.url))
const registeredText = await readFile(fileURLToPath(new URL('../src/presentations/index.ts', import.meta.url)), 'utf8')
const registeredSlugs = [...registeredText.matchAll(/slug:\s*['"]([^'"]+)['"]/g)].map((match) => match[1])
const requestedSlug = process.argv[2] ?? registeredSlugs[0]
if (!registeredSlugs.length) throw new Error('No presentations are registered in src/presentations/index.ts')
if (!requestedSlug || !registeredSlugs.includes(requestedSlug)) {
  console.error(`FAIL: unknown presentation slug "${requestedSlug ?? ''}". Registered: ${registeredSlugs.join(', ')}`)
  process.exit(1)
}

const availablePort = async () => {
  const probe = createServer()
  await new Promise((resolve, reject) => { probe.once('error', reject); probe.listen(0, '127.0.0.1', resolve) })
  const { port } = probe.address()
  await new Promise((resolve, reject) => probe.close((error) => error ? reject(error) : resolve()))
  return port
}
const run = (command, args) => new Promise((resolve, reject) => {
  const child = spawn(command, args, { cwd: appRoot, stdio: 'inherit', shell: process.platform === 'win32' })
  child.on('error', reject)
  child.on('exit', (code) => code === 0 ? resolve() : reject(new Error(`${command} ${args.join(' ')} exited ${code}`)))
})

let server
let browser
try {
  await run('npm', ['run', 'build'])
  const port = await availablePort()
  server = spawn(process.execPath, [fileURLToPath(new URL('../node_modules/vite/bin/vite.js', import.meta.url)), 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { cwd: appRoot, stdio: 'ignore' })
  const url = `http://127.0.0.1:${port}/${requestedSlug}`
  let ready = false
  for (let attempt = 0; attempt < 60; attempt++) {
    if (server.exitCode !== null) throw new Error('Preview server exited before becoming ready')
    try { ready = (await fetch(url)).ok; if (ready) break } catch {}
    await delay(250)
  }
  if (!ready) throw new Error(`Preview did not become ready at ${url}`)
  browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  const errors = []
  page.on('pageerror', (error) => errors.push(`uncaught page error: ${error.message}`))
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
  await page.goto(url, { waitUntil: 'networkidle' })
  try {
    await page.locator('[data-presentation-footer]').waitFor({ timeout: 5000 })
  } catch (error) {
    if (error?.name !== 'TimeoutError') throw error
    throw new Error(`No presentation rendered at /${requestedSlug}`)
  }
  await page.locator('[data-presentation-step-title]').waitFor({ timeout: 5000 })
  if (errors.length) throw new Error(`Browser errors: ${errors.join('; ')}`)
  console.log(`PASS: bootstrap builds and /${requestedSlug} renders in Chromium`)
} catch (error) {
  console.error(`FAIL: bootstrap verification: ${error.message}`)
  process.exitCode = 1
} finally {
  await browser?.close()
  if (server && server.exitCode === null) { server.kill('SIGTERM'); await new Promise((resolve) => server.once('exit', resolve)) }
}
