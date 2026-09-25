import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { startPreview, stopPreview } from './preview.mjs'

// Covers the kit's layout morph plus the delayed newcomer fade (0.62s + 0.35s).
const SETTLE_MS = 1000
const CHROME_HOOKS = ['data-presentation-caption', 'data-presentation-title', 'data-presentation-attribution', 'data-presentation-progress', 'data-presentation-toc']

const slug = process.argv[2]
if (!slug) { console.error('Usage: npm run inspect -- <presentation-slug>'); process.exit(2) }
const project = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
let preview
let browser
try {
  preview = startPreview(project)
  const url = await preview.ready
  browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
  await page.goto(`${url}/${encodeURIComponent(slug)}`)
  const root = page.locator('[data-step-count]')
  await root.waitFor()
  const count = Number(await root.getAttribute('data-step-count'))
  const output = path.join(project, 'artifacts/presentation-inspection', slug)
  await mkdir(output, { recursive: true })
  for (let index = 0; index < count; index++) {
    await page.waitForFunction((expected) => Number(document.querySelector('[data-step-index]')?.getAttribute('data-step-index')) === expected, index)
    await page.waitForTimeout(SETTLE_MS)
    const warnings = await page.evaluate((chromeHooks) => {
      const visible = (el) => { const rect = el.getBoundingClientRect(); const style = getComputedStyle(el); return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none' }
      const active = [...document.querySelectorAll('[data-presentation-progress-item], [data-presentation-toc-item]')].filter((el) => visible(el) && el.getAttribute('data-presentation-active') === 'true')
      const weakActive = active.some((el) => {
        const peers = [...(el.parentElement?.querySelectorAll('[data-presentation-progress-item], [data-presentation-toc-item]') ?? [])].filter((peer) => peer !== el && visible(peer))
        const a = getComputedStyle(el)
        const visiblyMarked = peers.some((peer) => {
          const b = getComputedStyle(peer)
          return a.color !== b.color || a.backgroundColor !== b.backgroundColor || a.borderColor !== b.borderColor || Number(a.fontWeight) >= Number(b.fontWeight) + 100 || (a.outlineStyle !== 'none' && parseFloat(a.outlineWidth) > 0) || a.boxShadow !== 'none'
        })
        return peers.length === 0 || !visiblyMarked
      })
      const attribution = document.querySelector('[data-presentation-attribution]')
      const attributionLink = attribution?.querySelector('a')
      const isWeakAttribution = () => {
        if (!attribution || !attributionLink) return true
        const linkStyle = getComputedStyle(attributionLink)
        return parseFloat(getComputedStyle(attribution).fontSize) < 12 || linkStyle.textDecorationLine === 'underline' || linkStyle.color === 'rgb(0, 0, 238)'
      }
      const candidates = [...document.querySelectorAll(['data-presentation-node', ...chromeHooks].map((hook) => `[${hook}]`).join(', '))]
      const describe = (el) => {
        if (!el.hasAttribute('data-presentation-node')) return chromeHooks.find((hook) => el.hasAttribute(hook))
        return `${el.getAttribute('data-presentation-node')}.${typeof el.className === 'string' ? el.className : ''}`
      }
      const overlaps = candidates.filter(visible).flatMap((a, i, all) => all.slice(i + 1).flatMap((b) => {
        if (a.closest('[data-allow-overlap]') || b.closest('[data-allow-overlap]')) return []
        const x = a.getBoundingClientRect(), y = b.getBoundingClientRect()
        return x.left < y.right && x.right > y.left && x.top < y.bottom && x.bottom > y.top ? [`${describe(a)} ↔ ${describe(b)}`] : []
      }))
      return { weakActive, weakAttribution: isWeakAttribution(), overlaps }
    }, CHROME_HOOKS)
    for (const pair of warnings.overlaps) console.warn(`WARN step ${index + 1}: possible unmarked visible text/chrome overlap: ${pair}`)
    if (warnings.weakActive) console.warn(`WARN step ${index + 1}: active progress or contents state may be indistinct`)
    if (warnings.weakAttribution) console.warn(`WARN step ${index + 1}: attribution is missing, browser-default, or undersized; style [data-presentation-attribution]`)
    await page.screenshot({ path: path.join(output, `step-${String(index + 1).padStart(2, '0')}.png`), fullPage: true })
    if (index + 1 < count) await page.keyboard.press('ArrowRight')
  }
  console.log(`Captured ${count} settled step screenshots in ${output}`)
} catch (error) { console.error(`Inspection failed: ${error.message}`); process.exitCode = 1 }
finally {
  await browser?.close()
  if (preview) await stopPreview(preview)
}
