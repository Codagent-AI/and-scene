import { spawn } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'
import { mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const slug = process.argv[2]
if (!slug || !/^[a-z0-9-]+$/.test(slug)) throw new Error('Usage: npm run inspect -- <presentation-slug>')
const output = `artifacts/${slug}`
await mkdir(output, { recursive: true })
const preview = spawn(process.execPath, [fileURLToPath(new URL('../node_modules/vite/bin/vite.js', import.meta.url)), 'preview', '--host', '127.0.0.1', '--port', '4173', '--strictPort'], { stdio: 'ignore' })
let browser
try {
  const started = Date.now()
  let ready = false
  while (!ready && Date.now() - started < 20000) {
    if (preview.exitCode !== null) throw new Error(`Preview exited ${preview.exitCode}`)
    try { ready = (await fetch('http://127.0.0.1:4173/')).ok } catch {}
    if (!ready) await delay(200)
  }
  if (!ready) throw new Error('Preview did not become ready at http://127.0.0.1:4173/')
  browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  await page.goto(`http://127.0.0.1:4173/${slug}`)
  await page.locator('[data-step-count]').waitFor({ timeout: 10000 })
  const total = Number(await page.locator('[data-step-count]').getAttribute('data-step-count'))
  if (!Number.isInteger(total) || total < 1) throw new Error(`Invalid step count for ${slug}`)
  for (let step = 0; step < total; step += 1) {
    if (step) {
      await page.keyboard.press('ArrowRight')
      await page.waitForFunction((index) => document.querySelector('[data-step-index]')?.getAttribute('data-step-index') === String(index), step, { timeout: 5000 })
    }
    await page.waitForTimeout(Number(process.env.INSPECT_SETTLE_MS ?? 1000))
    await page.screenshot({ path: `${output}/step-${String(step + 1).padStart(2, '0')}.png`, fullPage: true })
    const warnings = await page.evaluate(() => {
      const current = document.querySelector('[data-step-index]')?.getAttribute('data-step-index') ?? '?'
      const visible = (element) => {
        const style = getComputedStyle(element), rect = element.getBoundingClientRect()
        return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) > 0.05 && rect.width > 0 && rect.height > 0
      }
      const rectOf = (element) => { const r = element.getBoundingClientRect(); return { left: r.left, top: r.top, right: r.right, bottom: r.bottom } }
      const overlapArea = (a, b) => Math.max(0, Math.min(a.right,b.right)-Math.max(a.left,b.left)) * Math.max(0, Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top))
      const warnings = []
      const candidates = [...document.querySelectorAll('[data-presentation-stage] *, [data-presentation-header], [data-presentation-footer], [data-presentation-toc], [data-presentation-attribution-container]')]
        .filter((el) => visible(el) && el.children.length === 0 && (el.innerText || el.textContent || '').trim().length > 0 && !el.closest('[data-presentation-allow-overlap]'))
      for (let i = 0; i < candidates.length; i += 1) for (let j = i + 1; j < candidates.length; j += 1) {
        const a = candidates[i], b = candidates[j]
        if (a.contains(b) || b.contains(a)) continue
        const ar = rectOf(a), br = rectOf(b), area = overlapArea(ar, br)
        if (area > 16 && area / Math.min((ar.right-ar.left)*(ar.bottom-ar.top), (br.right-br.left)*(br.bottom-br.top)) > .08)
          warnings.push(`step ${Number(current)+1}: possible text/chrome overlap “${(a.innerText||a.textContent).trim().slice(0,36)}” / “${(b.innerText||b.textContent).trim().slice(0,36)}”`)
      }
      const signature = (el) => { const s=getComputedStyle(el); return [s.color,s.backgroundColor,s.borderColor,s.opacity,s.fontWeight].join('|') }
      for (const selector of ['[data-presentation-progress-item]', '[data-presentation-toc-item]']) {
        const items = [...document.querySelectorAll(selector)].filter(visible)
        const active = items.find((el) => el.getAttribute('data-presentation-active') === 'true')
        const inactive = items.find((el) => el.getAttribute('data-presentation-active') !== 'true')
        if (active && inactive && signature(active) === signature(inactive)) warnings.push(`step ${Number(current)+1}: active ${selector.includes('progress') ? 'progress' : 'table-of-contents'} state looks indistinguishable from inactive controls`)
      }
      const attribution = document.querySelector('[data-presentation-attribution]')
      if (!attribution || !visible(attribution)) warnings.push(`step ${Number(current)+1}: attribution link is missing or hidden`)
      else {
        const s = getComputedStyle(attribution), size = parseFloat(s.fontSize)
        if (size < 10) warnings.push(`step ${Number(current)+1}: attribution is undersized (${size}px); style [data-presentation-attribution]`)
        if (s.color === 'rgb(0, 0, 238)' && s.textDecorationLine.includes('underline')) warnings.push(`step ${Number(current)+1}: attribution appears browser-default; style [data-presentation-attribution]`)
      }
      return warnings
    })
    for (const warning of warnings) console.warn(`ADVISORY: ${warning}`)
  }
  console.log(`Captured ${total} settled step screenshots in ${output}`)
} finally {
  await browser?.close()
  if (preview.exitCode === null) { preview.kill('SIGTERM'); await Promise.race([new Promise((resolve) => preview.once('exit', resolve)), delay(3000)]) }
}
