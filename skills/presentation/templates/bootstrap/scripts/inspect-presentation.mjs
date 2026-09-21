import { mkdir } from 'node:fs/promises'
import { chromium } from 'playwright'

const slug = process.argv[2]
if (!slug) throw new Error('Usage: npm run inspect -- <presentation-slug>')
const baseURL = process.env.PRESENTATION_BASE_URL ?? 'http://127.0.0.1:4173'
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
const browserErrors = []
page.on('console', (message) => { if (message.type() === 'error') browserErrors.push(message.text()) })
page.on('pageerror', (error) => browserErrors.push(error.message))
await mkdir('artifacts/inspection', { recursive: true })
await page.goto(`${baseURL}/${slug}`)
const count = Number(await page.locator('[data-step-count]').getAttribute('data-step-count'))
for (let index = 0; index < count; index += 1) {
  if (index > 0) await page.keyboard.press('ArrowRight')
  await page.waitForTimeout(Number(process.env.PRESENTATION_SETTLE_MS ?? 700))
  await page.screenshot({ path: `artifacts/inspection/${slug}-${index + 1}.png`, fullPage: true })
  const active = page.locator('[data-presentation-progress-item][aria-current="step"], [data-presentation-toc-item][aria-current="step"]')
  if (await active.count() === 0) console.warn(`step ${index}: active navigation state is not exposed`)
  else if (await active.first().evaluate((node) => {
    const style = getComputedStyle(node)
    return style.color === getComputedStyle(node.parentElement?.querySelector('[data-active="false"]') ?? node).color && style.backgroundColor === getComputedStyle(node.parentElement?.querySelector('[data-active="false"]') ?? node).backgroundColor
  })) console.warn(`step ${index}: active navigation state may be visually indistinct`)
  const attribution = page.locator('[data-presentation-attribution]')
  if (await attribution.count() === 0) console.warn(`step ${index}: attribution hook is missing`)
  else if (await attribution.first().evaluate((node) => {
    const style = getComputedStyle(node)
    return style.fontSize === '0px' || Number.parseFloat(style.fontSize) < 11 || style.textDecorationLine === 'none' && node.querySelector('a')?.matches(':any-link') === false
  })) console.warn(`step ${index}: attribution may be too small or browser-default; style [data-presentation-attribution]`)
  const textNodes = await page.locator('[data-presentation-title], [data-presentation-caption], [data-presentation-toc], [data-presentation-controls], [data-presentation-attribution]').evaluateAll((nodes) => nodes.map((node) => { const rect = node.getBoundingClientRect(); return { rect: { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom, width: rect.width, height: rect.height }, allowed: Boolean(node.closest('[data-presentation-allow-overlap]')) } }).filter((item) => item.rect.width && item.rect.height))
  for (let left = 0; left < textNodes.length; left += 1) for (let right = left + 1; right < textNodes.length; right += 1) {
    const a = textNodes[left]; const b = textNodes[right]
    const collision = a.rect.left < b.rect.right && a.rect.right > b.rect.left && a.rect.top < b.rect.bottom && a.rect.bottom > b.rect.top
    if (collision && !a.allowed && !b.allowed) console.warn(`step ${index}: suspicious overlap between visible presentation chrome elements`)
  }
  if (browserErrors.length) throw new Error(`step ${index}: browser errors: ${browserErrors.join('; ')}`)
}
await browser.close()
console.log(`PASS: inspected ${count} step(s) for ${slug}`)
