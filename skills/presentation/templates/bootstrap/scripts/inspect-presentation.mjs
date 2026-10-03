import { mkdir } from 'node:fs/promises'
import { chromium } from 'playwright'
import { preview as startPreview } from 'vite'

const slug = process.argv[2]
if (!slug) { console.error('Usage: npm run inspect -- <presentation-slug>'); process.exit(2) }
const host = '127.0.0.1'
const port = Number(process.env.PRESENTATION_INSPECT_PORT ?? 4179)
const origin = `http://${host}:${port}`
const settleMs = Number(process.env.PRESENTATION_SETTLE_MS ?? 1000)
const output = `artifacts/presentation-inspection/${slug}`
await mkdir(output, { recursive: true })
let preview, browser
try {
  preview = await startPreview({ preview: { host, port, strictPort: true } })
  browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
  await page.goto(`${origin}/${encodeURIComponent(slug)}`, { waitUntil: 'networkidle' })
  const count = Number(await page.locator('[data-step-count]').getAttribute('data-step-count'))
  if (!Number.isInteger(count) || count < 1) throw new Error(`/${slug} did not render a presentation`)
  for (let index = 0; index < count; index++) {
    await page.waitForTimeout(settleMs)
    await page.screenshot({ path: `${output}/step-${String(index + 1).padStart(2, '0')}.png`, fullPage: true })
    const diagnostics = await page.evaluate(() => {
      const selectors = '[data-presentation-step-title], [data-presentation-caption], [data-presentation-toc-item], [data-presentation-step], [data-presentation-prev], [data-presentation-next], [data-presentation-attribution]'
      const visible = [...document.querySelectorAll(selectors)].filter((element) => {
        const rect = element.getBoundingClientRect(), style = getComputedStyle(element)
        return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none'
      })
      const label = (element) => {
        const hook = element.getAttributeNames().find((name) => name.startsWith('data-presentation-') && name !== 'data-presentation-active')
        const text = (element.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 40)
        return `${hook ? `[${hook}]` : element.tagName.toLowerCase()}${text ? ` "${text}"` : ''}`
      }
      const boxes = visible.map((element) => ({ element, rect: element.getBoundingClientRect(), allowed: Boolean(element.closest('[data-presentation-allow-overlap]')) }))
      const overlaps = []
      for (let left = 0; left < boxes.length; left++) for (let right = left + 1; right < boxes.length; right++) {
        const { element: first, rect: a, allowed: firstAllowed } = boxes[left], { element: second, rect: b, allowed: secondAllowed } = boxes[right]
        if (first.contains(second) || second.contains(first) || firstAllowed || secondAllowed) continue
        if (a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top) overlaps.push(`${label(first)} overlaps ${label(second)}`)
      }
      const indistinct = (selector) => {
        const active = document.querySelector(`${selector}[data-presentation-active="true"]`)
        const inactive = document.querySelector(`${selector}[data-presentation-active="false"]`)
        if (!active || !inactive) return false
        const a = getComputedStyle(active), b = getComputedStyle(inactive)
        return a.color === b.color && a.backgroundColor === b.backgroundColor && a.borderColor === b.borderColor && a.fontWeight === b.fontWeight && a.opacity === b.opacity
      }
      const attribution = document.querySelector('[data-presentation-attribution]')
      const attrStyle = attribution && getComputedStyle(attribution)
      const unpolished = !attribution || Number.parseFloat(attrStyle.fontSize) < 12 || !attribution.getAttribute('href') || (attrStyle.color === 'rgb(0, 0, 238)' && attrStyle.textDecorationLine.includes('underline'))
      return { overlaps, weakProgress: indistinct('[data-presentation-step]'), weakToc: indistinct('[data-presentation-toc-item]'), unpolished }
    })
    const warn = (message) => console.warn(`WARN step ${index + 1}: ${message}`)
    diagnostics.overlaps.forEach((message) => warn(`text/chrome overlap: ${message}`))
    if (diagnostics.weakProgress) warn('active progress styling is indistinct')
    if (diagnostics.weakToc) warn('active table-of-contents styling is indistinct')
    if (diagnostics.unpolished) warn('attribution is missing, browser-default, or undersized; style [data-presentation-attribution]')
    if (index < count - 1) {
      await page.keyboard.press('ArrowRight')
      await page.waitForFunction((next) => Number(document.querySelector('[data-step-index]')?.getAttribute('data-step-index')) === next, index + 1)
    }
  }
  console.log(`Captured ${count} settled steps in ${output}`)
} finally {
  await browser?.close()
  if (preview?.httpServer.listening) await new Promise((resolve, reject) => preview.httpServer.close((error) => error ? reject(error) : resolve()))
}
