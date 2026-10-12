/* global document */
import { spawn } from 'node:child_process'
import { createServer } from 'node:net'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'node:fs/promises'
import process from 'node:process'
import { chromium } from 'playwright'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const tail = (value) => value.split('\n').slice(-18).join('\n')
const fail = (phase, message) => {
  console.error(`[verify] FAIL phase=${phase} ${message}`)
  process.exitCode = 1
}

async function freePort() {
  const server = createServer()
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  const port = server.address().port
  await new Promise((resolve) => server.close(resolve))
  return port
}

async function browserInstance() {
  const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || process.env.CHROME_PATH
  try {
    return await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) })
  } catch (error) {
    throw new Error(`Could not launch Chromium. Install it with "npx playwright install chromium" or set PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH/CHROME_PATH. ${error.message}`, { cause: error })
  }
}

async function registeredSlugs() {
  const registry = await fs.readFile(path.join(root, 'src/presentations/index.ts'), 'utf8').catch(() => '')
  return [...registry.matchAll(/slug\s*:\s*["']([^"']+)["']/g)].map((match) => match[1])
}

async function verifyReference(config) {
  const { slug, stepSource, steps } = config.reference
  const registry = await fs.readFile(path.join(root, 'src/presentations/index.ts'), 'utf8').catch(() => '')
  const folder = path.join(root, 'src/presentations', slug)
  if (!new RegExp(`slug\\s*:\\s*["']${slug}["']`).test(registry) || !(await fs.stat(folder).catch(() => false))) {
    throw Object.assign(new Error(`reference sample is missing or not registered: ${slug}`), { phase: 'sample' })
  }
  const source = await fs.readFile(path.join(root, stepSource), 'utf8').catch(() => '')
  const rows = [...source.matchAll(/\[\s*"[^"]*"\s*,\s*"([^"]+)"\s*,\s*"([^"]+)"\s*\]/g)]
  if (rows.length !== steps.length) {
    throw Object.assign(new Error(`found ${rows.length} complete step rows; expected ${steps.length}`), { phase: 'sample' })
  }
  for (let index = 0; index < steps.length; index += 1) {
    const { title, caption } = steps[index]
    if (rows[index][1] !== title || rows[index][2] !== caption) {
      throw Object.assign(new Error(`step ${index + 1} is missing or out of order: expected "${title}"`), { phase: 'sample' })
    }
  }
  console.log(`[verify] sample: ${slug} has ${steps.length} ordered steps`)
  return [slug]
}

async function verifyRoutes(slugs, children, ensureRunning, onBrowser) {
  if (slugs.length === 0) throw Object.assign(new Error('No presentations are registered. Add one before running verify.'), { phase: 'routes' })
  console.log('[verify] render: starting production preview at 127.0.0.1')
  const port = await freePort()
  const server = spawn('npm', ['exec', '--', 'vite', 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { cwd: root, detached: true, stdio: ['ignore', 'ignore', 'pipe'] })
  children.add(server)
  let serverErrors = ''
  server.stderr.on('data', (chunk) => { serverErrors += chunk })
  const url = `http://127.0.0.1:${port}/`
  let ready = false
  for (let attempt = 0; attempt < 100; attempt += 1) {
    ensureRunning()
    if (server.exitCode !== null) break
    try {
      if ((await fetch(url)).ok) { ready = true; break }
    } catch { /* preview is starting */ }
    await sleep(100)
  }
  if (!ready) throw Object.assign(new Error(`preview did not become ready at ${url}. ${serverErrors}`), { phase: 'render' })
  console.log(`[verify] render: preview ready at ${url}`)
  const browser = await browserInstance()
  onBrowser(browser)
  try {
    for (const slug of slugs) {
      const page = await browser.newPage()
      let errors = []
      let currentStep = 1
      page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
      page.on('pageerror', (error) => errors.push(error.message))
      await page.goto(`${url}${slug}`, { waitUntil: 'networkidle' })
      ensureRunning()
      const chrome = page.locator('[data-step-count]').first()
      const count = Number(await chrome.getAttribute('data-step-count'))
      if (!Number.isInteger(count) || count < 1) throw Object.assign(new Error(`${slug}: first step has no valid data-step-count`), { phase: 'render' })
      if (errors.length) throw Object.assign(new Error(`${slug} step 1: ${errors.join('; ')}`), { phase: 'render' })
      console.log(`[verify] render: ${slug} route reports ${count} steps`)
      for (let index = 1; index < count; index += 1) {
        errors = []
        currentStep = index + 1
        await page.keyboard.press('ArrowRight')
        ensureRunning()
        try {
          await page.waitForFunction((expectedIndex) => Number(document.querySelector('[data-step-index]')?.getAttribute('data-step-index')) === expectedIndex, currentStep - 1, { timeout: 5000 })
        } catch {
          throw Object.assign(new Error(`${slug} step ${currentStep}: data-step-index did not advance`), { phase: 'render' })
        }
        if (errors.length) throw Object.assign(new Error(`${slug} step ${currentStep}: ${errors.join('; ')}`), { phase: 'render' })
        console.log(`[verify] render: ${slug} step ${currentStep}/${count}`)
      }
      await page.close()
    }
    console.log('[verify] render: all registered route steps rendered without browser errors')
    console.log('[verify] PASS')
  } finally {
    await browser.close().catch(() => {})
    onBrowser(null)
    if (server.pid) try { process.kill(-server.pid, 'SIGTERM') } catch { /* already exited */ }
    children.delete(server)
  }
}

async function main() {
  let browser
  const children = new Set()
  let interrupted = false
  const stop = (signal) => {
    interrupted = true
    process.exitCode = signal === 'SIGINT' ? 130 : 143
    for (const child of children) if (child.pid) try { process.kill(-child.pid, 'SIGTERM') } catch { /* already exited */ }
    if (browser) void browser.close().catch(() => {})
  }
  const onInterrupt = () => stop('SIGINT')
  const onTerminate = () => stop('SIGTERM')
  const ensureRunning = () => { if (interrupted) throw new Error('Verification interrupted') }
  process.once('SIGINT', onInterrupt)
  process.once('SIGTERM', onTerminate)
  try {
    console.log('[verify] build: running npm run build')
    const build = spawn('npm', ['run', 'build'], { cwd: root, detached: true, stdio: ['ignore', 'pipe', 'pipe'] })
    children.add(build)
    let output = ''
    build.stdout.on('data', (chunk) => { output += chunk })
    build.stderr.on('data', (chunk) => { output += chunk })
    const buildCode = await new Promise((resolve) => build.on('close', resolve))
    children.delete(build)
    ensureRunning()
    if (buildCode !== 0) return fail('build', `npm run build exited ${buildCode}\n${tail(output)}`)
    console.log('[verify] build: passed')

    const configFile = path.join(root, 'verify.config.json')
    const config = await fs.readFile(configFile, 'utf8').then(JSON.parse).catch((error) => error.code === 'ENOENT' ? null : Promise.reject(error))
    const slugs = config?.reference ? await verifyReference(config) : await registeredSlugs()
    await verifyRoutes(slugs, children, ensureRunning, (instance) => { browser = instance })
  } catch (error) {
    if (!interrupted) fail(error.phase || 'render', error.stack || error.message)
  } finally {
    process.removeListener('SIGINT', onInterrupt)
    process.removeListener('SIGTERM', onTerminate)
    if (browser) await browser.close().catch(() => {})
    for (const child of children) if (child.pid) try { process.kill(-child.pid, 'SIGTERM') } catch { /* already exited */ }
  }
}

await main()
