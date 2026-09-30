import { mkdir } from 'node:fs/promises'
import { relative, resolve } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { chromium } from 'playwright'
import { npmCommand, run, startPreview, terminatePreview, waitForPreview } from './browser-runtime.mjs'
import { collectVisualWarnings } from './visual-diagnostics.mjs'

const slug = process.argv[2]
const host = '127.0.0.1'
const port = 4174
const settleMs = 700
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

async function waitForStep(page, index) {
  const chrome = page.locator(`[data-step-index="${index}"]`)
  await chrome.waitFor({ state: 'attached' })
  await delay(settleMs)
}

function assertNoBrowserErrors(errors, stepIndex) {
  if (errors.length) throw new Error(`Browser error at step ${stepIndex}: ${errors.join('; ')}`)
}

if (!slug) throw new Error('Usage: npm run inspect -- <presentation-slug>')
if (!slugPattern.test(slug)) throw new Error('Invalid presentation slug')
const artifactsRoot = resolve('artifacts', 'presentation-inspection')
const output = resolve(artifactsRoot, slug)
if (relative(artifactsRoot, output).startsWith('..')) throw new Error('Invalid presentation artifact path')
await run(npmCommand, ['run', 'build'])
await mkdir(output, { recursive: true })
const { child: preview, started: previewStarted } = startPreview(host, port)
let browser

try {
  await previewStarted
  const url = `http://${host}:${port}/${slug}`
  await waitForPreview(url)
  browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  const errors = []
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto(url, { waitUntil: 'networkidle' })
  const chrome = page.locator('[data-step-count][data-step-index]')
  const count = Number(await chrome.getAttribute('data-step-count'))
  if (!Number.isInteger(count) || count < 1) throw new Error(`No renderable steps found at ${url}`)
  for (let index = 0; index < count; index += 1) {
    await waitForStep(page, index)
    assertNoBrowserErrors(errors, index)
    await page.screenshot({ path: resolve(output, `step-${String(index + 1).padStart(2, '0')}.png`), fullPage: true })
    const warnings = await page.evaluate(collectVisualWarnings)
    for (const warning of warnings) console.warn(`WARN step ${index}: ${warning}`)
    if (index < count - 1) {
      await page.keyboard.press('ArrowRight')
      await waitForStep(page, index + 1)
    }
  }
  assertNoBrowserErrors(errors, count - 1)
  console.log(`Captured ${count} settled screenshots in ${output}`)
} finally {
  await browser?.close()
  await terminatePreview(preview)
}
