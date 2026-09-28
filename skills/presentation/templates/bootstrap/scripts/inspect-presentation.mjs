import { mkdir } from 'node:fs/promises'
import { setTimeout as delay } from 'node:timers/promises'
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'

const slug = process.argv[2]
if (!slug) throw new Error('Usage: npm run inspect -- <presentation-slug>')
const host = '127.0.0.1'
const port = Number(process.env.PRESENTATION_INSPECT_PORT ?? 4179)
const origin = `http://${host}:${port}`
const output = `artifacts/presentation-inspection/${slug}`
await mkdir(output, { recursive: true })
const preview = spawn(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'preview', '--', '--host', host, '--port', String(port), '--strictPort'], { stdio: 'ignore' })
let browser
try {
  let ready = false
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try { ready = (await fetch(origin)).ok; if (ready) break } catch {}
    await delay(250)
  }
  if (!ready) throw new Error(`preview did not become ready at ${origin}; run npm run build first`)
  browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
  await page.goto(`${origin}/${encodeURIComponent(slug)}`, { waitUntil: 'networkidle' })
  const count = Number(await page.locator('[data-step-count]').getAttribute('data-step-count'))
  if (!Number.isInteger(count) || count < 1) throw new Error(`/${slug} did not render a presentation`)
  for (let index = 0; index < count; index += 1) {
    await page.waitForTimeout(Number(process.env.PRESENTATION_SETTLE_MS ?? 900))
    await page.screenshot({ path: `${output}/step-${String(index + 1).padStart(2, '0')}.png`, fullPage: true })
    const diagnostics = await page.evaluate(() => {
      const visible = [...document.querySelectorAll('[data-presentation-caption], [data-presentation-step-title], [data-presentation-toc], [data-presentation-progress], [data-presentation-attribution]')]
        .filter((element) => { const box = element.getBoundingClientRect(); return box.width > 0 && box.height > 0 })
      const overlaps = []
      for (let left = 0; left < visible.length; left += 1) for (let right = left + 1; right < visible.length; right += 1) {
        if (visible[left].closest('[data-presentation-allow-overlap]') || visible[right].closest('[data-presentation-allow-overlap]')) continue
        const a = visible[left].getBoundingClientRect(), b = visible[right].getBoundingClientRect()
        if (a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top) overlaps.push(`${visible[left].getAttribute('data-presentation-caption') ?? visible[left].getAttribute('data-presentation-step-title') ?? visible[left].getAttribute('data-presentation-toc') ?? visible[left].getAttribute('data-presentation-progress') ?? visible[left].getAttribute('data-presentation-attribution')} overlaps another visible element`)
      }
      const active = document.querySelector('[data-presentation-step][data-presentation-active="true"]')
      const inactive = document.querySelector('[data-presentation-step][data-presentation-active="false"]')
      const activeStyle = active && getComputedStyle(active), inactiveStyle = inactive && getComputedStyle(inactive)
      const weakActive = activeStyle && inactiveStyle && activeStyle.color === inactiveStyle.color && activeStyle.backgroundColor === inactiveStyle.backgroundColor && activeStyle.borderColor === inactiveStyle.borderColor
      const attribution = document.querySelector('[data-presentation-attribution]')
      return { overlaps, weakActive, attribution: attribution ? { fontSize: getComputedStyle(attribution).fontSize, href: attribution.getAttribute('href') } : null }
    })
    for (const item of diagnostics.overlaps) console.warn(`WARN step ${index + 1}: overlap: ${item}`)
    if (diagnostics.weakActive) console.warn(`WARN step ${index + 1}: active progress styling is indistinct`)
    if (!diagnostics.attribution || Number.parseFloat(diagnostics.attribution.fontSize) < 12 || !diagnostics.attribution.href) console.warn(`WARN step ${index + 1}: attribution is missing or undersized; style [data-presentation-attribution]`)
    if (index < count - 1) { await page.keyboard.press('ArrowRight'); await page.waitForFunction((next) => Number(document.querySelector('[data-step-index]')?.getAttribute('data-step-index')) === next, index + 1) }
  }
  console.log(`Captured ${count} settled steps in ${output}`)
} finally {
  await browser?.close()
  preview.kill('SIGTERM')
}
