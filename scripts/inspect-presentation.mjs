import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { chromium } from 'playwright'
import { collectDiagnostics } from './inspection-diagnostics.mjs'

const host = '127.0.0.1'
const projectRoot = resolve(process.env.AND_SCENE_PROJECT_ROOT || process.cwd())
const port = Number(process.env.PORT || 4179)
const slug = process.argv[2]
const settleMs = Number(process.env.INSPECT_SETTLE_MS || 1100)
if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error('Usage: npm run inspect -- <presentation-slug>')
const server = spawn(process.execPath, [resolve(projectRoot, 'node_modules/vite/bin/vite.js'), 'preview', '--host', host, '--port', String(port), '--strictPort'], { cwd: projectRoot, stdio: 'ignore' })
let browser
async function stopPreview() {
  if (server.exitCode !== null || server.signalCode !== null) return
  const exited = once(server, 'exit')
  server.kill('SIGTERM')
  await exited
}
async function waitForPreview(url) {
  for (let attempt = 0; attempt < 80; attempt++) {
    if (server.exitCode !== null) throw new Error(`preview exited with ${server.exitCode}`)
    try {
      if ((await fetch(url)).ok) { await delay(100); return }
    } catch {}
    await delay(250)
  }
  throw new Error(`preview did not become ready at ${url}`)
}
try {
  const url = `http://${host}:${port}/${slug}`
  await waitForPreview(url)
  browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  const errors = []
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto(url, { waitUntil: 'networkidle' })
  const presentation = page.locator('[data-step-count]')
  await presentation.waitFor({ timeout: 5000 }).catch(() => { throw new Error('route does not expose data-step-count') })
  const count = Number(await presentation.getAttribute('data-step-count'))
  if (!Number.isInteger(count) || count < 1) throw new Error('route has no valid data-step-count hook')
  const artifactDir = resolve(projectRoot, 'artifacts/inspection', slug)
  await mkdir(artifactDir, { recursive: true })
  for (let index = 0; index < count; index++) {
    await page.waitForTimeout(settleMs)
    await page.screenshot({ path: resolve(artifactDir, `step-${String(index + 1).padStart(2, '0')}.png`), fullPage: true })
    const warnings = await page.evaluate(collectDiagnostics)
    warnings.forEach((warning) => console.log(`Step ${index + 1}: Visual advisory: ${warning}`))
    const current = Number(await presentation.getAttribute('data-step-index'))
    if (current !== index) throw new Error(`capture ${index + 1}: expected active step index ${index}, found ${current}`)
    console.log(`Captured settled step ${current + 1}/${count}`)
    if (index < count - 1) {
      await page.keyboard.press('ArrowRight')
      await page.waitForFunction((expected) => Number(document.querySelector('[data-step-index]')?.getAttribute('data-step-index')) === expected, index + 1)
    }
  }
  if (errors.length) throw new Error(`browser errors: ${errors.join('; ')}`)
  console.log(`Screenshots: ${artifactDir}`)
} finally {
  try { await browser?.close() } finally { await stopPreview() }
}
