import { mkdir } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import { join } from 'node:path'
import { startOwnedPreview, waitForPreviewResponse } from './preview-server.mjs'

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

async function diagnostics(page) {
  return page.evaluate(() => {
    const visible = (element) => {
      const style = getComputedStyle(element)
      const rect = element.getBoundingClientRect()
      return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) > 0 && rect.width > 0 && rect.height > 0
    }
    const allowed = (element) => Boolean(element.closest('[data-presentation-allow-overlap]'))
    const candidates = [...document.querySelectorAll('[data-presentation-caption], [data-presentation-header], [data-presentation-progress], [data-presentation-toc], [data-presentation-step-controls], [data-presentation-attribution], [data-presentation-step-title]')]
      .filter((element) => visible(element) && !allowed(element))
    const overlaps = []
    for (let left = 0; left < candidates.length; left += 1) for (let right = left + 1; right < candidates.length; right += 1) {
      const a = candidates[left]
      const b = candidates[right]
      if (a.contains(b) || b.contains(a)) continue
      const ar = a.getBoundingClientRect()
      const br = b.getBoundingClientRect()
      if (ar.left < br.right && ar.right > br.left && ar.top < br.bottom && ar.bottom > br.top) overlaps.push('unmarked text/chrome overlap')
    }
    const indistinct = (selector, activeSelector) => {
      const active = document.querySelector(activeSelector)
      const inactive = [...document.querySelectorAll(selector)].find((element) => element !== active)
      if (!active || !inactive || !visible(active) || !visible(inactive)) return false
      const a = getComputedStyle(active)
      const b = getComputedStyle(inactive)
      return ['color', 'backgroundColor', 'borderColor', 'fontWeight', 'opacity', 'transform'].every((property) => a[property] === b[property])
    }
    const attribution = document.querySelector('[data-presentation-attribution="true"]')
    const style = attribution ? getComputedStyle(attribution) : undefined
    return {
      overlaps,
      indistinctProgress: indistinct('[data-presentation-progress] button', '[data-presentation-progress-active="true"]'),
      indistinctToc: indistinct('[data-presentation-toc] button', '[data-presentation-toc-active="true"]'),
      attributionWarning: !attribution || document.querySelectorAll('[data-presentation-attribution="true"]').length !== 1 || Number.parseFloat(style?.fontSize ?? '0') < 10 || (style?.color === 'rgb(0, 0, 238)' && style.textDecorationLine.includes('underline')),
    }
  })
}

run('npm', ['run', 'build'])
await mkdir('inspection-artifacts', { recursive: true })
let preview
let browser
try {
  const url = `http://${host}:${port}/${slug}`
  preview = await startOwnedPreview({ host, port })
  await waitForPreviewResponse(url)
  const { chromium } = await import('playwright')
  browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  await page.goto(url, { waitUntil: 'networkidle' })
  const chrome = page.locator('[data-presentation-chrome="true"]')
  const count = Number(await chrome.getAttribute('data-step-count'))
  for (let index = 0; index < count; index += 1) {
    await page.waitForTimeout(settleMs)
    const warnings = await diagnostics(page)
    for (const warning of warnings.overlaps) console.warn(`WARN step ${index + 1}: ${warning}`)
    if (warnings.indistinctProgress) console.warn(`WARN step ${index + 1}: active progress state is visually indistinct.`)
    if (warnings.indistinctToc) console.warn(`WARN step ${index + 1}: active table-of-contents state is visually indistinct.`)
    if (warnings.attributionWarning) console.warn(`WARN step ${index + 1}: attribution is missing, browser-default, or undersized.`)
    await page.screenshot({ path: join('inspection-artifacts', `${slug}-${String(index + 1).padStart(2, '0')}.png`), fullPage: true })
    if (index < count - 1) await page.keyboard.press('ArrowRight')
  }
  const attribution = page.locator('[data-presentation-attribution="true"]')
  if (await attribution.count() !== 1) console.warn('WARN: attribution is missing or ambiguous; style the attribution hook locally.')
  console.log(`Captured ${count} settled screenshots in inspection-artifacts/.`)
} finally {
  await browser?.close()
  await preview?.close()
}
