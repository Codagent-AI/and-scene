import { createServer } from 'node:net'
import { spawn } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'
import { fileURLToPath } from 'node:url'
import { readFile } from 'node:fs/promises'
import { chromium } from '@playwright/test'
import { parsePresentationRegistry } from './presentation-registry.mjs'

const root = fileURLToPath(new URL('..', import.meta.url))
const run = (command, args) => new Promise((resolve, reject) => {
  const child = spawn(command, args, { cwd: root, stdio: 'inherit' })
  child.once('error', reject)
  child.once('exit', (code) => code === 0 ? resolve() : reject(new Error(`${command} ${args.join(' ')} exited with ${code}`)))
})
async function freePort() {
  const probe = createServer()
  await new Promise((resolve, reject) => { probe.once('error', reject); probe.listen(0, '127.0.0.1', resolve) })
  const { port } = probe.address()
  await new Promise((resolve, reject) => probe.close((error) => error ? reject(error) : resolve()))
  return port
}
async function stop(server) {
  if (server.exitCode !== null || server.signalCode !== null) return
  const closed = new Promise((resolve) => server.once('close', resolve))
  const timeout = setTimeout(() => server.kill('SIGKILL'), 3000)
  server.kill('SIGTERM')
  await closed
  clearTimeout(timeout)
}
async function main() {
  await run('npm', ['run', 'build'])
  const source = await readFile(new URL('../src/presentations/index.ts', import.meta.url), 'utf8')
  const presentations = parsePresentationRegistry(source)
  const port = await freePort()
  const base = `http://127.0.0.1:${port}`
  const vite = fileURLToPath(new URL('../node_modules/vite/bin/vite.js', import.meta.url))
  const server = spawn(process.execPath, [vite, 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { cwd: root, stdio: ['ignore', 'ignore', 'pipe'] })
  let startup = ''
  server.stderr.setEncoding('utf8'); server.stderr.on('data', (chunk) => { startup += chunk })
  let browser
  try {
    let ready = false
    for (let attempt = 0; attempt < 60; attempt += 1) {
      if (server.exitCode !== null) throw new Error(`preview failed: ${startup.trim()}`)
      try { ready = (await fetch(base, { signal: AbortSignal.timeout(1000) })).ok; if (ready) break } catch { /* bounded readiness probe */ }
      await delay(250)
    }
    if (!ready) throw new Error(`preview readiness failed at ${base}: ${startup.trim()}`)
    browser = await chromium.launch({ headless: true })
    const page = await browser.newPage()
    let currentRoute = presentations[0].slug
    let currentStep = 1
    const errors = []
    page.on('console', (message) => { if (message.type() === 'error') errors.push(`${currentRoute} step ${currentStep}: console error: ${message.text()}`) })
    page.on('pageerror', (error) => errors.push(`${currentRoute} step ${currentStep}: uncaught page error: ${error.message}`))
    let rendered = 0
    for (const { slug } of presentations) {
      currentRoute = slug
      currentStep = 1
      await page.goto(`${base}/${encodeURIComponent(slug)}`, { waitUntil: 'networkidle' })
      const footer = page.locator('[data-step-count]')
      await footer.waitFor()
      const count = Number(await footer.getAttribute('data-step-count'))
      if (!Number.isInteger(count) || count < 1) throw new Error(`${slug} render check failed: invalid data-step-count “${count}”`)
      const originalViewport = page.viewportSize() ?? { width: 1280, height: 720 }
      try {
        await page.setViewportSize({ width: 390, height: 844 })
        await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))))
        const titleBounds = await page.locator('.presentation-header__title').boundingBox()
        const toggleBounds = await page.locator('[data-presentation-mode-toggle]').boundingBox()
        if (!titleBounds || !toggleBounds) {
          throw new Error(`${slug} render check failed: header title or mode toggle is not rendered at narrow width`)
        }
        const overlaps = titleBounds.x < toggleBounds.x + toggleBounds.width &&
          titleBounds.x + titleBounds.width > toggleBounds.x &&
          titleBounds.y < toggleBounds.y + toggleBounds.height &&
          titleBounds.y + titleBounds.height > toggleBounds.y
        if (overlaps) throw new Error(`${slug} render check failed: header title overlaps the mode toggle at narrow width`)
      } finally {
        await page.setViewportSize(originalViewport)
      }
      for (let index = 0; index < count; index += 1) {
        currentStep = index + 1
        await page.waitForTimeout(650)
        const actual = Number(await page.locator('[data-step-index]').getAttribute('data-step-index'))
        if (actual !== index) throw new Error(`${slug} step ${index + 1}: expected index ${index}, found ${actual}`)
        if (errors.length) throw new Error(errors[0])
        rendered += 1
        if (index < count - 1) {
          await page.keyboard.press('ArrowRight')
          try { await page.waitForFunction((next) => Number(document.querySelector('[data-step-index]')?.getAttribute('data-step-index')) === next, index + 1, { timeout: 2500 }) }
          catch { throw new Error(`${slug} step ${index + 2}: transition did not advance data-step-index`) }
        }
      }
    }
    if (errors.length) throw new Error(errors[0])
    console.log(`PASS: built app and rendered ${rendered} steps across ${presentations.length} registered presentations on ${base}`)
  } finally {
    await browser?.close()
    await stop(server)
  }
}
main().catch((error) => { console.error(`FAIL: ${error instanceof Error ? error.message : error}`); process.exitCode = 1 })
