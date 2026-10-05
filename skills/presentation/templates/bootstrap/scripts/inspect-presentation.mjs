import { mkdir } from 'node:fs/promises'
import { spawn, spawnSync } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'
import { chromium } from 'playwright'

const slug = process.argv[2]
if (!slug) { console.error('Usage: npm run inspect -- <presentation-slug>'); process.exit(2) }
const port = Number(process.env.PORT ?? 4180)
const base = `http://127.0.0.1:${port}/${slug}`
const output = `artifacts/inspection/${slug}`
{
  const build = spawnSync('npm', ['run', 'build'], { stdio: 'inherit' })
  if (build.status !== 0) process.exit(build.status ?? 1)
}
const preview = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { stdio: 'inherit' })
let browser
try {
  let ready = false
  for (let i = 0; i < 60; i++) {
    try { if ((await fetch(`http://127.0.0.1:${port}`)).ok) { ready = true; break } } catch {}
    if (preview.exitCode !== null) throw new Error(`preview exited with ${preview.exitCode}`)
    await delay(250)
  }
  if (!ready) throw new Error('preview did not become ready')
  await mkdir(output, { recursive: true })
  browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
  await page.goto(base, { waitUntil: 'networkidle' })
  const root = page.locator('[data-presentation]')
  const count = Number(await root.getAttribute('data-step-count'))
  if (!count) throw new Error(`route ${base} did not expose presentation step hooks`)
  for (let index = 0; index < count; index++) {
    await page.waitForFunction(() => document.querySelector('[data-presentation-scene]')?.getAttribute('data-settled') !== 'false')
    await page.waitForTimeout(800)
    await page.screenshot({ path: `${output}/step-${String(index + 1).padStart(2, '0')}.png`, fullPage: true })
    if (index < count - 1) {
      await page.keyboard.press('ArrowRight')
      await page.waitForFunction(expected => Number(document.querySelector('[data-presentation]')?.getAttribute('data-step-index')) === expected, index + 1)
    }
  }
  if (errors.length) throw new Error(`browser errors: ${errors.join('; ')}`)
  console.log(`Captured ${count} settled steps in ${output}. Review screenshots for visual composition.`)
} catch (error) {
  console.error(`Inspection failed: ${error.message}`)
  process.exitCode = 1
} finally {
  await browser?.close()
  preview.kill('SIGTERM')
}
