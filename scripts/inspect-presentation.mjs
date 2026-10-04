import { mkdir } from 'node:fs/promises'
import { setTimeout as delay } from 'node:timers/promises'
import { chromium } from 'playwright'
import { startPreview } from './preview-server.mjs'

const slug = process.argv[2]
if (!slug) throw new Error('Usage: npm run inspect -- <presentation-slug>')

const settleMs = Number(process.env.INSPECT_SETTLE_MS ?? 900)
const outputDirectory = 'inspection'
let preview
let browser

async function findTextOverlaps(page) {
  return page.evaluate(() => {
    const candidates = []
    const walker = document.createTreeWalker(document.querySelector('[data-presentation]'), NodeFilter.SHOW_TEXT)
    while (walker.nextNode()) {
      const text = walker.currentNode
      const owner = text.parentElement
      if (!text.textContent.trim() || !owner || owner.closest('[data-presentation-allow-overlap]')) continue

      const style = getComputedStyle(owner)
      if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) continue

      const range = document.createRange()
      range.selectNodeContents(text)
      for (const bounds of range.getClientRects()) {
        if (bounds.width <= 1 || bounds.height <= 1) continue
        const marker = owner.closest('[data-entity-id], [data-presentation-progress-item], [data-presentation-toc-item], [data-presentation-attribution]')
        const name = marker?.getAttribute('data-entity-id')
          || marker?.getAttribute('aria-label')
          || owner.className.baseVal
          || owner.className
          || owner.tagName.toLowerCase()
        candidates.push({ bounds, name, owner })
      }
    }

    candidates.sort((left, right) => left.bounds.left - right.bounds.left)
    const warnings = new Set()
    const maxComparisons = 50_000
    const maxWarnings = 40
    let comparisons = 0
    let comparisonLimitReached = false

    for (let leftIndex = 0; leftIndex < candidates.length; leftIndex += 1) {
      const left = candidates[leftIndex]
      for (let rightIndex = leftIndex + 1; rightIndex < candidates.length; rightIndex += 1) {
        const right = candidates[rightIndex]
        if (right.bounds.left >= left.bounds.right - 1) break
        comparisons += 1
        if (comparisons > maxComparisons) {
          comparisonLimitReached = true
          break
        }
        if (left.owner === right.owner || left.owner.contains(right.owner) || right.owner.contains(left.owner)) continue
        const verticalOverlap = left.bounds.top < right.bounds.bottom - 1
          && left.bounds.bottom > right.bounds.top + 1
        if (verticalOverlap) warnings.add(`visible text overlap: ${left.name} ↔ ${right.name}; use data-presentation-allow-overlap only for intentional readable overlap`)
        if (warnings.size >= maxWarnings) break
      }
      if (warnings.size >= maxWarnings || comparisonLimitReached) break
    }
    if (comparisonLimitReached) warnings.add('overlap analysis reached its comparison limit; inspect this dense step manually')
    return [...warnings]
  })
}

async function findChromeWarnings(page) {
  return page.evaluate(() => {
    const warnings = []
    const activeItems = document.querySelectorAll('[data-presentation-progress-item][data-active="true"], [data-presentation-toc-item][data-active="true"]')
    for (const active of activeItems) {
      const inactiveSelector = active.matches('[data-presentation-progress-item]')
        ? '[data-presentation-progress-item][data-active="false"]'
        : '[data-presentation-toc-item][data-active="false"]'
      const inactive = document.querySelector(inactiveSelector)
      if (!inactive) continue
      const activeStyle = getComputedStyle(active)
      const inactiveStyle = getComputedStyle(inactive)
      const styleKeys = ['color', 'backgroundColor', 'opacity', 'borderColor', 'fontWeight', 'textDecorationLine']
      const styleIsSame = styleKeys.every(key => activeStyle[key] === inactiveStyle[key])
      const sizeIsSame = Math.abs(active.getBoundingClientRect().width - inactive.getBoundingClientRect().width) < 2
      if (styleIsSame && sizeIsSame) warnings.push('active progress or table-of-contents state may be visually indistinct')
    }

    const attribution = document.querySelector('[data-presentation-attribution]')
    if (!attribution || !attribution.textContent.trim()) {
      warnings.push('missing attribution; style [data-presentation-attribution]')
    } else {
      const link = attribution.querySelector('a')
      const target = link ?? attribution
      const style = getComputedStyle(target)
      if (attribution.getBoundingClientRect().width < 100 || Number.parseFloat(style.fontSize) < 12) {
        warnings.push('attribution may be undersized; style [data-presentation-attribution]')
      }
      if (link && ['rgb(0, 0, 238)', 'rgb(85, 26, 139)'].includes(style.color)) {
        warnings.push('attribution may use browser-default link styling; style [data-presentation-attribution]')
      }
    }
    return warnings
  })
}

async function inspect(page, root, stepCount) {
  for (let index = 0; index < stepCount; index += 1) {
    const actualIndex = Number(await root.getAttribute('data-step-index'))
    if (actualIndex !== index) {
      throw new Error(`Expected step ${index + 1}, observed step ${actualIndex + 1} for presentation ${slug}`)
    }

    await delay(settleMs)
    const filename = `${outputDirectory}/${slug}-${String(index + 1).padStart(2, '0')}.png`
    await page.screenshot({ path: filename })

    const warnings = [
      ...await findTextOverlaps(page),
      ...await findChromeWarnings(page),
    ]
    for (const warning of warnings) console.warn(`WARN step ${index + 1}: ${warning}`)

    if (index === stepCount - 1) continue
    await page.keyboard.press('ArrowRight')
    await page.waitForFunction(
      expected => Number(document.querySelector('[data-presentation]')?.getAttribute('data-step-index')) === expected,
      index + 1,
    )
  }
}

try {
  await mkdir(outputDirectory, { recursive: true })
  preview = await startPreview()
  const previewUrl = await preview.waitForPreview()
  browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  await page.goto(`${previewUrl}/${slug}`, { waitUntil: 'networkidle' })
  const root = page.locator('[data-presentation]')
  await root.waitFor()
  const stepCount = Number(await root.getAttribute('data-step-count'))
  if (!Number.isInteger(stepCount) || stepCount < 1) throw new Error(`Invalid data-step-count for ${slug}`)
  await inspect(page, root, stepCount)
  console.log(`Captured ${stepCount} settled steps in ${outputDirectory}/`)
} catch (error) {
  console.error(`Inspection failed: ${error.message}`)
  process.exitCode = 1
} finally {
  await browser?.close()
  await preview?.stop()
}
