import { spawn, spawnSync } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'
import { chromium } from 'playwright'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const registry = await readFile(new URL('../src/presentations/index.ts', import.meta.url), 'utf8')
const routes = [...registry.matchAll(/slug:\s*['"]([^'"]+)['"]/g)].map((match) => match[1])

const build = spawnSync('npm', ['run', 'build'], { stdio: 'inherit' })
if (build.status !== 0) process.exit(build.status ?? 1)

const child = spawn(process.execPath, [fileURLToPath(new URL('../node_modules/vite/bin/vite.js', import.meta.url)), 'preview', '--host', '127.0.0.1', '--port', '4173', '--strictPort'], { stdio: 'inherit' })
let browser
try {
  await new Promise((resolve, reject) => {
    child.once('error', reject)
    const started = Date.now()
    const poll = async () => {
      try { const response = await fetch('http://127.0.0.1:4173/'); if (response.ok) return resolve() } catch {}
      if (Date.now() - started > 20000) return reject(new Error('Preview did not become ready'))
      await delay(200); poll()
    }
    poll()
  })
  if (!routes.length) throw new Error('No presentations are registered')
  browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
  const slug = process.argv[2] ?? routes[0]
  if (!routes.includes(slug)) throw new Error(`Presentation route is not registered: ${slug}`)
  await page.goto(`http://127.0.0.1:4173/${slug}`)
  await page.locator('[data-step-count]').waitFor()
  const count = Number(await page.locator('[data-step-count]').getAttribute('data-step-count'))
  if (!Number.isInteger(count) || count < 1) throw new Error(`Invalid step count for ${slug}`)
  for (let index = 0; index < count; index += 1) {
    if (index > 0) {
      await page.keyboard.press('ArrowRight')
      await page.waitForFunction((expected) => document.querySelector('[data-step-index]')?.getAttribute('data-step-index') === String(expected), index)
    }
    await page.waitForTimeout(900)
    if (errors.length) throw new Error(`Render failed at step ${index}: ${errors.splice(0).join('; ')}`)
    console.log(`PASS: ${slug} rendered at step ${index}`)
  }
} catch (error) {
  console.error(`Verification failed: ${error.message}`)
  process.exitCode = 1
} finally {
  await browser?.close()
  child.kill('SIGTERM')
}
