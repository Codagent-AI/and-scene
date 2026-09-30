import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { setTimeout as delay } from 'node:timers/promises'
import { chromium } from 'playwright'
import { collectVisualWarnings } from './visual-warnings.mjs'

const slug = process.argv[2]
const host = '127.0.0.1'
const port = 4174
const baseUrl = `http://${host}:${port}`
const settleMs = 700

if (!slug) {
  console.error('Usage: npm run inspect -- <presentation-slug>')
  process.exit(1)
}

async function waitForPreview() {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try { if ((await fetch(baseUrl)).ok) return } catch { /* starting */ }
    await delay(100)
  }
  throw new Error(`preview did not become ready at ${baseUrl}`)
}

async function inspect() {
  const output = join('artifacts', 'presentation-inspection', slug)
  await mkdir(output, { recursive: true })
  const server = spawn(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['vite', 'preview', '--host', host, '--port', String(port), '--strictPort'], { stdio: 'inherit' })
  let browser
  try {
    await waitForPreview()
    browser = await chromium.launch()
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
    await page.goto(`${baseUrl}/${slug}`, { waitUntil: 'networkidle' })
    const root = page.locator('[data-presentation-root]')
    const count = Number(await root.getAttribute('data-step-count'))
    for (let index = 0; index < count; index += 1) {
      await page.waitForTimeout(settleMs)
      await page.screenshot({ path: join(output, `step-${String(index + 1).padStart(2, '0')}.png`), fullPage: true })
      const warnings = await page.evaluate(collectVisualWarnings)
      for (const warning of warnings) console.warn(`INSPECT WARNING step ${index + 1}: ${warning}`)
      if (index < count - 1) await page.keyboard.press('ArrowRight')
    }
    console.log(`INSPECT COMPLETE: screenshots written to ${output}`)
  } finally {
    await browser?.close()
    if (!server.killed) server.kill('SIGTERM')
    await once(server, 'exit').catch(() => undefined)
  }
}

inspect().catch((error) => { console.error(error); process.exitCode = 1 })
