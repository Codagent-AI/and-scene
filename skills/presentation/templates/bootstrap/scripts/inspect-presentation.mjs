import { spawn } from 'node:child_process'
import { mkdir } from 'node:fs/promises'
import { setTimeout as delay } from 'node:timers/promises'
import { chromium } from '@playwright/test'

const slug = process.argv[2]
if (!slug) throw new Error('Usage: npm run inspect -- <presentation-slug>')
const output = `artifacts/inspection/${slug}`
await mkdir(output, { recursive: true })
const server = spawn('npm', ['run', 'preview', '--', '--host', '127.0.0.1', '--port', '4179', '--strictPort'], { stdio: 'ignore' })
let browser
try {
  let ready = false
  for (let i = 0; i < 50; i++) { try { ready = (await fetch('http://127.0.0.1:4179/')).ok; if (ready) break } catch {} await delay(200) }
  if (!ready) throw new Error('Run npm run build first; preview did not start')
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
      const active = [...document.querySelectorAll('[data-presentation-active="true"]')]
      const attribution = document.querySelector('[data-presentation-attribution]')
      const attrStyle = attribution && getComputedStyle(attribution)
      return { collisions, active: active.map((el) => ({ color: getComputedStyle(el).color, background: getComputedStyle(el).backgroundColor, weight: getComputedStyle(el).fontWeight })), attribution: attribution ? { text: attribution.textContent, color: attrStyle.color, background: attrStyle.backgroundColor, size: parseFloat(attrStyle.fontSize), href: attribution.getAttribute('href') } : null }
    })
    for (const collision of checks.collisions) warnings.push(`step ${index + 1}: overlapping visible nodes: ${collision}`)
    if (!checks.active.some(({ color, background, weight }) => color !== 'rgba(0, 0, 0, 0)' || background !== 'rgba(0, 0, 0, 0)' || Number(weight) >= 600)) warnings.push(`step ${index + 1}: active navigation state may not be visually distinct`)
    if (!checks.attribution || !checks.attribution.href?.startsWith('https://') || checks.attribution.size < 10 || checks.attribution.text?.trim() !== 'made by and-scene') warnings.push(`step ${index + 1}: attribution is missing or may be browser-default/undersized`)
    if (index + 1 < count) { await page.keyboard.press('ArrowRight'); await page.waitForFunction((expected) => Number(document.querySelector('[data-step-index]')?.getAttribute('data-step-index')) === expected, index + 1) }
  }
  console.log(`Screenshots: ${output}/`)
  if (warnings.length) console.warn(`Advisory visual warnings:\n${warnings.map((item) => `- ${item}`).join('\n')}`)
  else console.log('No advisory visual warnings.')
} finally { await browser?.close(); server.kill('SIGTERM') }
