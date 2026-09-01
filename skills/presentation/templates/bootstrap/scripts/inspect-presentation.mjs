import { mkdir } from 'node:fs/promises'
import { spawn, spawnSync } from 'node:child_process'
import { join } from 'node:path'

const host = '127.0.0.1'
const port = Number(process.env.PRESENTATION_INSPECT_PORT ?? 4174)
const slug = process.argv[2]
const settleMs = Number(process.env.PRESENTATION_SETTLE_MS ?? 750)

if (!slug) throw new Error('Usage: npm run inspect -- <presentation-slug>')
if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error('Invalid presentation slug')

function run(command, args) {
  const result = spawnSync(command, args, { stdio: 'inherit' })
  if (result.status !== 0) throw new Error(`${command} ${args.join(' ')} failed`)
}

async function waitForServer(url) {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try { if ((await fetch(url)).ok) return } catch { /* preview is still starting */ }
    await new Promise((resolve) => setTimeout(resolve, 250))
  }
  throw new Error(`Timed out waiting for ${url}`)
}

run('npm', ['run', 'build'])
await mkdir('inspection-artifacts', { recursive: true })
const preview = spawn('npm', ['run', 'preview', '--', '--host', host, '--port', String(port), '--strictPort'], { stdio: 'inherit' })
let browser
try {
  const url = `http://${host}:${port}/${slug}`
  await waitForServer(url)
  const { chromium } = await import('playwright')
  browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  await page.goto(url, { waitUntil: 'networkidle' })
  const chrome = page.locator('[data-presentation-chrome="true"]')
  const count = Number(await chrome.getAttribute('data-step-count'))
  for (let index = 0; index < count; index += 1) {
    await page.waitForTimeout(settleMs)
    await page.screenshot({ path: join('inspection-artifacts', `${slug}-${String(index + 1).padStart(2, '0')}.png`), fullPage: true })
    if (index < count - 1) await page.keyboard.press('ArrowRight')
  }
  const attribution = page.locator('[data-presentation-attribution="true"]')
  if (await attribution.count() !== 1) console.warn('WARN: attribution is missing or ambiguous; style the attribution hook locally.')
  console.log(`Captured ${count} settled screenshots in inspection-artifacts/.`)
} finally {
  await browser?.close()
  preview.kill('SIGTERM')
}
