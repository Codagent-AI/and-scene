import { spawn } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'
import { mkdir } from 'node:fs/promises'
import { chromium } from 'playwright'

const slug = process.argv[2]
if (!slug) throw new Error('Usage: npm run inspect -- <presentation-slug>')
const output = `artifacts/${slug}`
await mkdir(output, { recursive: true })
const child = spawn('npm', ['run', 'preview', '--', '--host', '127.0.0.1', '--port', '4173', '--strictPort'], { stdio: 'ignore' })
let browser
try {
  let ready = false
  for (let i = 0; i < 100 && !ready; i++) { try { ready = (await fetch('http://127.0.0.1:4173/')).ok } catch {} if (!ready) await delay(200) }
  if (!ready) throw new Error('Preview did not become ready')
  browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  await page.goto(`http://127.0.0.1:4173/${slug}`)
  await page.locator('[data-step-count]').waitFor()
  const total = Number(await page.locator('[data-step-count]').getAttribute('data-step-count'))
  for (let step = 0; step < total; step++) {
    if (step) await page.keyboard.press('ArrowRight')
    await page.waitForFunction((index) => document.querySelector('[data-step-index]')?.getAttribute('data-step-index') === String(index), step)
    await page.waitForTimeout(500)
    await page.screenshot({ path: `${output}/step-${String(step + 1).padStart(2, '0')}.png`, fullPage: true })
  }
  console.log(`Captured ${total} settled step screenshots in ${output}`)
  console.log('Advisory visual review: inspect screenshots for collisions, active-state clarity, and attribution polish.')
} finally { await browser?.close(); child.kill('SIGTERM') }
