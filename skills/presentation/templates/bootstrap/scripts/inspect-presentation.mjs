import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { preview } from 'vite'

const slug = process.argv[2]
if (!slug) throw new Error('Usage: npm run inspect -- <presentation-slug>')
const root = fileURLToPath(new URL('../', import.meta.url))
const artifacts = resolve(root, 'artifacts/presentations', slug)
const settleMs = Number(process.env.AND_SCENE_SETTLE_MS ?? 900)
await mkdir(artifacts, { recursive: true })
let server
let browser
try {
  server = await preview({ root, preview: { host: '127.0.0.1', port: 0, strictPort: true } })
  const baseUrl = server.resolvedUrls?.local?.[0]
  if (!baseUrl?.startsWith('http://127.0.0.1:')) throw new Error('preview did not bind to 127.0.0.1')
  browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  const route = new URL(`${slug}/`, baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`)
  await page.goto(route.href, { waitUntil: 'networkidle' })
  const hook = page.locator('[data-step-count][data-step-index]')
  const total = Number(await hook.getAttribute('data-step-count'))
  if (!total) throw new Error(`no registered presentation found at /${slug}`)
  for (let step = 0; step < total; step++) {
    if (step) {
      await page.keyboard.press('ArrowRight')
      await page.waitForFunction((index) => Number(document.querySelector('[data-step-index]')?.getAttribute('data-step-index')) === index, step)
    }
    // Allow the authored transition interval, then wait for active browser animations to settle.
    await page.waitForTimeout(settleMs)
    await page.evaluate(async () => {
      const running = document.getAnimations({ subtree: true }).filter((animation) => animation.playState === 'running')
      await Promise.race([Promise.all(running.map((animation) => animation.finished.catch(() => undefined))), new Promise((resolve) => setTimeout(resolve, 1500))])
    })
    await page.screenshot({ path: resolve(artifacts, `step-${String(step + 1).padStart(2, '0')}.png`), fullPage: true })
    const diagnostics = await page.evaluate(() => {
      const visible = (el) => {
        const rect = el.getBoundingClientRect(), style = getComputedStyle(el)
        return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) > 0
      }
      const describe = (el) => `${el.getAttribute('aria-label') || el.textContent?.trim().replace(/\s+/g, ' ').slice(0, 36) || el.tagName}.${typeof el.className === 'string' ? el.className.trim().replace(/\s+/g, '.') : ''}`
      const candidates = [...document.querySelectorAll('main [data-presentation-label],main [data-presentation-box],main [data-presentation-symbol-chip],main [data-presentation-emphasis],main [data-presentation-frame],main [data-presentation-header],main [data-presentation-footer],main [data-presentation-progress] button,main [data-presentation-toc] button,main [data-presentation-attribution]')].filter(visible)
      const collisions = []
      for (let i = 0; i < candidates.length; i++) for (let j = i + 1; j < candidates.length; j++) {
        const a = candidates[i], b = candidates[j]
        if (a.contains(b) || b.contains(a) || a.closest('[data-presentation-allow-overlap]') || b.closest('[data-presentation-allow-overlap]')) continue
        const ar = a.getBoundingClientRect(), br = b.getBoundingClientRect()
        const area = Math.max(0, Math.min(ar.right, br.right) - Math.max(ar.left, br.left)) * Math.max(0, Math.min(ar.bottom, br.bottom) - Math.max(ar.top, br.top))
        if (area > 16 && (a.textContent?.trim() || b.textContent?.trim())) collisions.push(`${describe(a)} / ${describe(b)}`)
      }
      const indistinct = []
      for (const [name, selector] of [['progress', '[data-presentation-progress]'], ['table of contents', '[data-presentation-toc]']]) {
        const nav = document.querySelector(selector)
        const active = nav?.querySelector('[data-presentation-active]')
        const inactive = nav?.querySelector('button:not([data-presentation-active])')
        if (!active || !inactive || !visible(active) || !visible(inactive)) continue
        const a = getComputedStyle(active), b = getComputedStyle(inactive)
        const sameStyle = ['color', 'backgroundColor', 'borderColor', 'opacity', 'fontWeight', 'outlineColor'].every((key) => a[key] === b[key])
        const ar = active.getBoundingClientRect(), br = inactive.getBoundingClientRect()
        if (sameStyle && Math.abs(ar.width - br.width) < 2 && Math.abs(ar.height - br.height) < 2) indistinct.push(name)
      }
      const attribution = document.querySelector('[data-presentation-attribution]')
      let attributionWeak = !attribution || !visible(attribution)
      if (attribution) {
        const style = getComputedStyle(attribution), rect = attribution.getBoundingClientRect()
        attributionWeak ||= parseFloat(style.fontSize) < 10 || style.textDecorationLine.includes('underline') || ['rgb(0, 0, 238)', 'rgb(0, 0, 255)'].includes(style.color) || rect.width < 70 || rect.height < 12
      }
      return { collisions, indistinct, attributionWeak }
    })
    for (const collision of diagnostics.collisions) console.warn(`WARN step ${step + 1}: possible text/chrome overlap: ${collision}`)
    for (const nav of diagnostics.indistinct) console.warn(`WARN step ${step + 1}: active ${nav} state may be visually indistinct`)
    if (diagnostics.attributionWeak) console.warn(`WARN step ${step + 1}: style [data-presentation-attribution] for legible, non-default attribution`)
  }
  console.log(`Captured ${total} settled screenshots in ${artifacts}`)
} catch (error) {
  console.error(`FAIL inspect ${slug}: ${error.message}`)
  process.exitCode = 1
} finally {
  await browser?.close()
  if (server?.httpServer) await new Promise((resolve, reject) => server.httpServer.close((error) => error ? reject(error) : resolve()))
}
