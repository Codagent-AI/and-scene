import { spawn } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { setTimeout as delay } from 'node:timers/promises'
import { chromium } from 'playwright'

const base = 'http://127.0.0.1:4173'
let preview
let browser
try {
  const build = spawn('npm', ['run', 'build'], { stdio: 'inherit', shell: process.platform === 'win32' })
  const buildCode = await new Promise((resolve, reject) => {
    build.once('error', reject)
    build.once('exit', (code) => resolve(code ?? 1))
  })
  if (buildCode !== 0) throw new Error(`Build failed with exit code ${buildCode}`)

  preview = spawn('npm', ['run', 'preview', '--', '--host', '127.0.0.1', '--port', '4173', '--strictPort'], { stdio: 'ignore', shell: process.platform === 'win32' })
  let ready = false
  for (let attempt = 0; attempt < 60; attempt += 1) {
    if (preview.exitCode !== null) throw new Error('Preview server exited before becoming ready')
    try { if ((await fetch(base)).ok) { ready = true; break } } catch { /* server is still starting */ }
    await delay(250)
  }
  if (!ready) throw new Error(`Preview did not become ready at ${base}`)

  browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  const errors = []
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
  page.on('pageerror', (error) => errors.push(error.message))
  const registry = await readFile(new URL('../src/presentations/index.ts', import.meta.url), 'utf8')
  const slug = registry.match(/slug:\s*['"]([^'"]+)['"]/)?.[1]
  if (!slug) throw new Error('No presentation is registered in src/presentations/index.ts')
  await page.goto(`${base}/${slug}`)
  await page.locator('[data-step-count]').waitFor()
  const count = Number(await page.locator('[data-step-count]').getAttribute('data-step-count'))
  if (!count) throw new Error('Registered presentation exposes no steps')
  for (let index = 0; index < count; index += 1) {
    const observed = Number(await page.locator('[data-step-index]').getAttribute('data-step-index'))
    if (observed !== index) throw new Error(`Step transition failed: expected ${index}, observed ${observed}`)
    await page.waitForTimeout(800)
    if (index + 1 < count) await page.keyboard.press('ArrowRight')
  }
  if (errors.length) throw new Error(`Browser errors: ${errors.join('; ')}`)
  console.log(`PASS: built and rendered ${count} step(s) at ${base}/${slug}`)
} catch (error) {
  console.error(`VERIFY FAILED: ${error instanceof Error ? error.message : error}`)
  process.exitCode = 1
} finally {
  await browser?.close()
  if (preview && preview.exitCode === null) preview.kill('SIGTERM')
}
