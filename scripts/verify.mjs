import { spawn } from 'node:child_process'
import { createRequire } from 'node:module'
import { setTimeout as delay } from 'node:timers/promises'
import { pathToFileURL } from 'node:url'
import path from 'node:path'
import fs from 'node:fs/promises'
import net from 'node:net'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const require = createRequire(path.join(root, 'package.json'))
const { chromium } = require('playwright')
let phase = 'build'
let preview
let browser
let previewError

function fail(message) { throw new Error(`${phase}: ${message}`) }
function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd: root, stdio: 'inherit', ...options })
    child.once('error', reject)
    child.once('exit', (code, signal) => code === 0 ? resolve() : reject(new Error(`command exited ${code ?? signal}`)))
  })
}
async function freePort() {
  return await new Promise((resolve, reject) => {
    const server = net.createServer()
    server.once('error', reject)
    server.listen(0, '127.0.0.1', () => { const { port } = server.address(); server.close(() => resolve(port)) })
  })
}
async function waitReady(url) {
  const until = Date.now() + 30000
  while (Date.now() < until) {
    if (previewError) fail(`preview could not start: ${previewError.message}`)
    try { if ((await fetch(url)).ok) return } catch {}
    await delay(200)
  }
  fail(`preview did not become ready at ${url}`)
}
async function cleanup() {
  await browser?.close().catch(() => {})
  if (preview && preview.exitCode === null) {
    preview.kill('SIGTERM')
    await Promise.race([new Promise((resolve) => preview.once('exit', resolve)), delay(3000)])
    if (preview.exitCode === null) preview.kill('SIGKILL')
  }
}
for (const [signal, code] of [['SIGINT', 130], ['SIGTERM', 143]]) {
  process.once(signal, async () => { await cleanup(); process.exit(code) })
}
function readRoutes(source) {
  return [...source.matchAll(/slug:\s*['"]([^'"]+)['"]/g)].map((match) => match[1])
}

try {
  await run(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'build'])
  phase = 'sample'
  const registry = await fs.readFile(path.join(root, 'src/presentations/index.ts'), 'utf8').catch(() => '')
  const routes = readRoutes(registry)
  const expectationPath = path.join(root, 'scripts/reference-sample.json')
  let reference
  try { reference = JSON.parse(await fs.readFile(expectationPath, 'utf8')) } catch (error) { if (error.code !== 'ENOENT') throw error }
  if (reference) {
    if (!routes.includes(reference.slug)) fail(`reference presentation '${reference.slug}' is not registered`)
    if (!Array.isArray(reference.titles) || !Array.isArray(reference.captions) || reference.titles.length !== reference.captions.length) fail('reference sample expectations are malformed')
  }
  if (!routes.length) fail('no registered presentations found in src/presentations/index.ts')

  phase = 'render'
  const port = await freePort()
  const vite = path.resolve(path.dirname(require.resolve('vite')), '../../bin/vite.js')
  preview = spawn(process.execPath, [vite, 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { cwd: root, stdio: 'inherit' })
  preview.once('error', (error) => { previewError = error })
  const base = `http://127.0.0.1:${port}`
  await waitReady(base)
  browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  let activeStep = 1
  const errors = []
  page.on('console', (message) => { if (message.type() === 'error') errors.push({ step: activeStep, message: message.text() }) })
  page.on('pageerror', (error) => errors.push({ step: activeStep, message: error.message }))

  for (const slug of routes) {
    const url = `${base}/${slug}`
    activeStep = 1
    await page.goto(url, { waitUntil: 'networkidle' })
    const rootLocator = page.locator('[data-step-count][data-step-index]').first()
    try { await rootLocator.waitFor({ timeout: 10000 }) } catch { fail(`step 1: route '${slug}' did not render presentation hooks`) }
    const count = Number(await rootLocator.getAttribute('data-step-count'))
    if (!Number.isInteger(count) || count < 1) fail(`step 1: route '${slug}' has invalid data-step-count`)
    if (reference?.slug === slug && count !== reference.titles.length) fail(`step 1: expected ${reference.titles.length} sample steps, found ${count}`)
    for (let index = 0; index < count; index++) {
      activeStep = index + 1
      await rootLocator.waitFor({ state: 'visible' })
      const observed = Number(await rootLocator.getAttribute('data-step-index'))
      if (observed !== index) fail(`step ${index + 1}: expected data-step-index ${index}, got ${observed}`)
      if (reference?.slug === slug) {
        const title = reference.titles[index]
        const caption = reference.captions[index]
        await page.keyboard.press('P').catch(() => {})
        await page.waitForTimeout(80)
        const presentTitle = (await page.locator('[data-presentation-title]').allTextContents()).join(' ').trim()
        if (!presentTitle.includes(title)) fail(`step ${index + 1}: title mismatch, expected '${title}'`)
        await page.keyboard.press('P')
        await page.waitForTimeout(80)
        const browseCaption = (await page.locator('[data-presentation-caption]').allTextContents()).join(' ').trim()
        if (!browseCaption.includes(caption)) fail(`step ${index + 1}: caption mismatch, expected '${caption}'`)
      }
      const currentErrors = errors.filter((entry) => entry.step === index + 1)
      if (currentErrors.length) fail(`step ${index + 1}: ${currentErrors.map((entry) => entry.message).join('; ')}`)
      if (index < count - 1) {
        await page.keyboard.press('ArrowRight')
        await page.waitForFunction((expected) => Number(document.querySelector('[data-step-index]')?.getAttribute('data-step-index')) === expected, index + 1, { timeout: 3000 }).catch(() => fail(`step ${index + 2}: ArrowRight did not advance the public step index`))
      }
    }
  }
  if (errors.length) fail(`step ${errors[0].step}: ${errors[0].message}`)
  console.log(`PASS verify: build, sample${reference ? ', and' : ' and'} render (${routes.length} presentation${routes.length === 1 ? '' : 's'})`)
} catch (error) {
  console.error(`FAIL verify [${phase}]: ${error.message}`)
  process.exitCode = 1
} finally {
  await cleanup()
}
