import { mkdir } from 'node:fs/promises'
import { chromium } from '@playwright/test'
import { startPreview } from './preview-server.mjs'

const slug = process.argv[2]
if (!slug) throw new Error('Usage: npm run inspect -- <presentation-slug>')
const output = `artifacts/inspection/${slug}`
await mkdir(output, { recursive: true })
let preview
let browser
try {
  preview = await startPreview(4179)
  browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
  await page.goto(`http://127.0.0.1:4179/${slug}`, { waitUntil: 'networkidle' })
  const count = Number(await page.locator('[data-step-count]').getAttribute('data-step-count'))
  if (!count) throw new Error(`No presentation found at /${slug}`)
  const warnings = []
  for (let index = 0; index < count; index++) {
    await page.waitForTimeout(900)
    await page.screenshot({ path: `${output}/step-${String(index + 1).padStart(2, '0')}.png`, fullPage: true })
    const checks = await page.evaluate(() => {
      const visible = (el) => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' }
      const nodes = [...document.querySelectorAll('[data-presentation-node]')].filter(visible)
      const collisions = []
      for (let a = 0; a < nodes.length; a++) for (let b = a + 1; b < nodes.length; b++) {
        const x = nodes[a].getBoundingClientRect(), y = nodes[b].getBoundingClientRect()
        if (x.left < y.right && x.right > y.left && x.top < y.bottom && x.bottom > y.top && !nodes[a].closest('[data-presentation-allow-overlap]') && !nodes[b].closest('[data-presentation-allow-overlap]')) collisions.push(`${nodes[a].textContent?.trim()} / ${nodes[b].textContent?.trim()}`)
      }
      const groups = ['[data-presentation-progress-step]', '[data-presentation-toc-entry]'].map((selector) => {
        const entries = [...document.querySelectorAll(selector)]
        const signature = (el) => {
          const style = getComputedStyle(el)
          return [style.color, style.backgroundColor, style.fontWeight, style.border, style.outline, style.textDecorationLine].join('|')
        }
        const active = entries.find((el) => el.getAttribute('data-presentation-active') === 'true' || el.getAttribute('aria-current'))
        return { hasInactive: entries.some((el) => el !== active), distinct: Boolean(active) && entries.filter((el) => el !== active).every((el) => signature(active) !== signature(el)) }
      }).filter((group) => group.hasInactive)
      const attribution = document.querySelector('[data-presentation-attribution]')
      const attrStyle = attribution && getComputedStyle(attribution)
      return { collisions, groups, attribution: attribution ? { text: attribution.textContent, color: attrStyle.color, background: attrStyle.backgroundColor, size: parseFloat(attrStyle.fontSize), href: attribution.getAttribute('href') } : null }
    })
    for (const collision of checks.collisions) warnings.push(`step ${index + 1}: overlapping visible nodes: ${collision}`)
    if (checks.groups.some((group) => !group.distinct)) warnings.push(`step ${index + 1}: active navigation state may not be visually distinct from inactive entries`)
    if (!checks.attribution || !checks.attribution.href?.startsWith('https://') || checks.attribution.size < 10 || checks.attribution.text?.trim() !== 'made by and-scene') warnings.push(`step ${index + 1}: attribution is missing or may be browser-default/undersized`)
    if (index + 1 < count) { await page.keyboard.press('ArrowRight'); await page.waitForFunction((expected) => Number(document.querySelector('[data-step-index]')?.getAttribute('data-step-index')) === expected, index + 1) }
  }
  console.log(`Screenshots: ${output}/`)
  if (warnings.length) console.warn(`Advisory visual warnings:\n${warnings.map((item) => `- ${item}`).join('\n')}`)
  else console.log('No advisory visual warnings.')
} finally { await browser?.close(); await preview?.stop() }
