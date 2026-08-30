import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { setTimeout as delay } from 'node:timers/promises'
import { chromium } from 'playwright'
import { getAvailablePort, waitForPreview, watchPreview } from './preview-server.mjs'

const slug = process.argv[2]
const host = '127.0.0.1'
const settleMs = 750

function overlapWarnings(index) {
  const visible = (element) => {
    const style = getComputedStyle(element)
    const rect = element.getBoundingClientRect()
    return style.visibility !== 'hidden' && style.display !== 'none' && Number(style.opacity) > 0 && rect.width > 0 && rect.height > 0
  }
  const description = (element) => element.getAttribute('data-presentation-node') || element.getAttribute('data-presentation-header') || element.getAttribute('data-presentation-footer') || element.getAttribute('data-presentation-toc') || element.getAttribute('data-presentation-attribution') || element.textContent?.trim().slice(0, 36) || element.tagName.toLowerCase()
  const intersects = (first, second) => first.left < second.right && first.right > second.left && first.top < second.bottom && first.bottom > second.top
  const text = Array.from(document.querySelectorAll('[data-presentation] *')).filter((element) => element.children.length === 0 && element.textContent?.trim() && visible(element))
  const warnings = []
  for (let firstIndex = 0; firstIndex < text.length; firstIndex += 1) {
    for (let secondIndex = firstIndex + 1; secondIndex < text.length; secondIndex += 1) {
      const first = text[firstIndex]
      const second = text[secondIndex]
      if (first.closest('[data-presentation-allow-overlap]') || second.closest('[data-presentation-allow-overlap]')) continue
      if (intersects(first.getBoundingClientRect(), second.getBoundingClientRect())) warnings.push(`step ${index + 1}: visible overlap between ${description(first)} and ${description(second)}`)
    }
  }
  return [...new Set(warnings)]
}

if (!slug) throw new Error('Usage: npm run inspect -- <presentation-slug>')

let preview
let browser
try {
  const port = await getAvailablePort(host)
  preview = spawn('npm', ['run', 'preview', '--', '--host', host, '--port', String(port), '--strictPort'], { stdio: 'inherit' })
  const getPreviewFailure = watchPreview(preview)
  const previewUrl = `http://${host}:${port}`
  await waitForPreview(`${previewUrl}/`, getPreviewFailure)
  browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  await page.goto(`${previewUrl}/${slug}`, { waitUntil: 'networkidle' })
  const root = page.locator('[data-presentation]')
  await root.waitFor()
  const count = Number(await root.getAttribute('data-step-count'))
  if (!Number.isInteger(count) || count < 1) throw new Error('Presentation did not expose a valid data-step-count.')
  const artifactDirectory = resolve('artifacts', 'presentation-inspection', slug)
  await mkdir(artifactDirectory, { recursive: true })

  for (let index = 0; index < count; index += 1) {
    await delay(settleMs)
    await page.screenshot({ path: resolve(artifactDirectory, `step-${String(index + 1).padStart(2, '0')}.png`), fullPage: true })
    for (const warning of await page.evaluate(overlapWarnings, index)) console.warn(`INSPECT WARN: ${warning}`)
    const chromeWarning = await page.evaluate(() => {
      const active = document.querySelector('[data-presentation-progress-active="true"], [data-presentation-toc-active="true"]')
      const inactive = document.querySelector('[data-presentation-progress] button:not([data-presentation-progress-active]), [data-presentation-toc] button:not([data-presentation-toc-active])')
      return active && inactive && getComputedStyle(active).cssText === getComputedStyle(inactive).cssText
        ? 'active navigation is visually indistinct' : null
    })
    if (chromeWarning) console.warn(`INSPECT WARN: step ${index + 1}: ${chromeWarning}`)
    const attributionWarning = await page.evaluate(() => {
      const attribution = document.querySelector('[data-presentation-attribution]')
      if (!attribution) return 'attribution is missing'
      const style = getComputedStyle(attribution)
      return Number.parseFloat(style.fontSize) < 10 || (style.color === 'rgb(0, 0, 238)' && style.textDecorationLine.includes('underline'))
        ? 'attribution needs presentation-owned styling' : null
    })
    if (attributionWarning) console.warn(`INSPECT WARN: step ${index + 1}: ${attributionWarning}`)
    if (index < count - 1) await page.keyboard.press('ArrowRight')
  }
  console.log(`INSPECT PASS: screenshots written to ${artifactDirectory}`)
} finally {
  await browser?.close()
  if (preview) {
    preview.kill('SIGTERM')
    await once(preview, 'exit').catch(() => undefined)
  }
}
