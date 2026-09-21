import { mkdir } from 'node:fs/promises'
import { chromium } from 'playwright'

const slug = process.argv[2]
if (!slug) throw new Error('Usage: npm run inspect -- <presentation-slug>')
const baseURL = process.env.PRESENTATION_BASE_URL ?? 'http://127.0.0.1:4173'
const settle = Number(process.env.PRESENTATION_SETTLE_MS ?? 700)
const browser = await chromium.launch()
const warnings = []
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  const browserErrors = []
  page.on('console', (message) => { if (message.type() === 'error') browserErrors.push(message.text()) })
  page.on('pageerror', (error) => browserErrors.push(error.message))
  await mkdir('artifacts/inspection', { recursive: true })
  await page.goto(`${baseURL}/${slug}`, { waitUntil: 'networkidle' })
  const count = Number(await page.locator('[data-step-count]').getAttribute('data-step-count'))
  for (let index = 0; index < count; index += 1) {
    if (index > 0) await page.keyboard.press('ArrowRight')
    await page.waitForTimeout(settle)
    await page.screenshot({ path: `artifacts/inspection/${slug}-${index + 1}.png`, fullPage: true })
    const active = page.locator('[data-presentation-progress-item][aria-current="step"], [data-presentation-toc-item][aria-current="step"]')
    if (await active.count() === 0) warnings.push(`step ${index}: active navigation state is not exposed`)
    else if (await active.first().evaluate((node) => {
      const style = getComputedStyle(node)
      const inactive = node.parentElement?.querySelector('[data-active="false"]')
      if (!inactive) return false
      const other = getComputedStyle(inactive)
      return style.color === other.color && style.backgroundColor === other.backgroundColor && style.borderColor === other.borderColor
    })) warnings.push(`step ${index}: active navigation state may be visually indistinct`)
    const attribution = page.locator('[data-presentation-attribution]')
    if (await attribution.count() === 0) warnings.push(`step ${index}: attribution hook is missing`)
    else if (await attribution.first().evaluate((node) => {
      const style = getComputedStyle(node)
      const link = node.querySelector('a')
      return Number.parseFloat(style.fontSize) < 11 || !link || style.textDecorationLine === 'none' && link.matches(':any-link') === false
    })) warnings.push(`step ${index}: attribution may be too small or browser-default; style [data-presentation-attribution]`)
    const nodes = await page.locator('[data-presentation-title], [data-presentation-caption], [data-presentation-toc], [data-presentation-controls], [data-presentation-attribution]').evaluateAll((items) => items.map((node) => {
      const rect = node.getBoundingClientRect()
      return { name: node.getAttribute('data-presentation-title') ? 'title' : node.getAttribute('data-presentation-caption') ? 'caption' : node.tagName.toLowerCase(), rect: { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom, width: rect.width, height: rect.height }, allowed: Boolean(node.closest('[data-presentation-allow-overlap]')) }
    }).filter((item) => item.rect.width && item.rect.height))
    for (let left = 0; left < nodes.length; left += 1) for (let right = left + 1; right < nodes.length; right += 1) {
      const a = nodes[left]; const b = nodes[right]
      const collision = a.rect.left < b.rect.right && a.rect.right > b.rect.left && a.rect.top < b.rect.bottom && a.rect.bottom > b.rect.top
      if (collision && !a.allowed && !b.allowed) warnings.push(`step ${index}: suspicious overlap between ${a.name} and ${b.name}`)
    }
    if (browserErrors.length) warnings.push(`step ${index}: browser errors: ${browserErrors.join('; ')}`)
  }
  for (const warning of warnings) console.warn(`ADVISORY: ${warning}`)
  console.log(`PASS: inspected ${count} step(s) for ${slug}; ${warnings.length} advisory warning(s)`)
} finally { await browser.close() }
