import { mkdir } from 'node:fs/promises'
import { spawn, spawnSync } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'
import { chromium } from 'playwright'

const slug = process.argv[2]
if (!slug) { console.error('Usage: npm run inspect -- <presentation-slug>'); process.exit(2) }
const port = Number(process.env.PORT ?? 4180)
const base = `http://127.0.0.1:${port}/${slug}`
const output = `artifacts/inspection/${slug}`
const build = spawnSync('npm', ['run', 'build'], { stdio: 'inherit' })
if (build.status !== 0) process.exit(build.status ?? 1)
const preview = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { stdio: 'inherit' })
let browser
const warnings = []
try {
  let ready = false
  for (let i = 0; i < 60; i++) {
    try { if ((await fetch(`http://127.0.0.1:${port}`)).ok) { ready = true; break } } catch {}
    if (preview.exitCode !== null) throw new Error(`preview exited with ${preview.exitCode}`)
    await delay(250)
  }
  if (!ready) throw new Error('preview did not become ready')
  await mkdir(output, { recursive: true })
  browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
  const errors = []
  let stepIndex = 0
  page.on('pageerror', error => errors.push(`step ${stepIndex}: ${error.message}`))
  page.on('console', message => { if (message.type() === 'error') errors.push(`step ${stepIndex}: ${message.text()}`) })
  await page.goto(base, { waitUntil: 'networkidle' })
  const root = page.locator('[data-presentation]')
  const count = Number(await root.getAttribute('data-step-count'))
  if (!count) throw new Error(`route ${base} did not expose presentation step hooks`)
  for (stepIndex = 0; stepIndex < count; stepIndex++) {
    await page.waitForFunction(() => [...document.getAnimations()].every(animation => !['running', 'pending'].includes(animation.playState)))
    await page.waitForTimeout(800)
    const diagnostics = await page.evaluate(() => {
      const found = []
      const allowed = element => Boolean(element.closest('[data-presentation-allow-overlap]'))
      const visible = element => {
        const rect = element.getBoundingClientRect()
        const style = getComputedStyle(element)
        return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) > 0
      }
      const selectors = '[data-presentation-node], [data-presentation-caption], [data-presentation-step-title], [data-presentation-present-title], [data-presentation-progress], [data-presentation-toc], [data-presentation-attribution], [data-presentation-mode-toggle]'
      const directText = [...document.querySelectorAll('body *')].filter(element => [...element.childNodes].some(node => node.nodeType === Node.TEXT_NODE && node.textContent?.trim()))
      const items = [...new Set([...document.querySelectorAll(selectors), ...directText])].filter(visible)
      for (const item of items) {
        const text = item.textContent?.trim().replace(/\\s+/g, ' ').slice(0, 70) || item.getAttribute('data-presentation-node') || item.tagName.toLowerCase()
        const a = item.getBoundingClientRect()
        if (item.closest('[data-presentation-allow-overlap]')) continue
        for (const other of items) {
          if (item === other || item.contains(other) || other.contains(item) || allowed(other)) continue
          const b = other.getBoundingClientRect()
          const overlapX = Math.min(a.right, b.right) - Math.max(a.left, b.left)
          const overlapY = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top)
          if (overlapX > 4 && overlapY > 4 && text < (other.textContent?.trim() ?? '')) {
            const otherText = other.textContent?.trim().replace(/\\s+/g, ' ').slice(0, 70) || other.tagName.toLowerCase()
            found.push(`overlap: “${text}” / “${otherText}”`)
          }
        }
      }
      const canvas = document.querySelector('[data-presentation-canvas]')
      const stage = document.querySelector('[data-presentation-stage]')
      if (canvas && stage) {
        const c = canvas.getBoundingClientRect()
        const s = stage.getBoundingClientRect()
        if (c.left < s.left - 1 || c.right > s.right + 1 || c.top < s.top - 1 || c.bottom > s.bottom + 1) found.push('canvas: diagram extends beyond its stage viewport')
      }
      for (const selector of ['[data-presentation-progress]', '[data-presentation-toc]']) {
        const group = document.querySelector(selector)
        if (!group || !visible(group)) continue
        const active = group.querySelector('[data-presentation-active="true"]')
        const inactive = [...group.querySelectorAll('button')].find(button => button !== active)
        if (!active || !inactive) continue
        const signature = element => { const style = getComputedStyle(element); return [style.color, style.backgroundColor, style.borderColor, style.opacity, style.fontWeight, style.outlineStyle].join('|') }
        if (signature(active) === signature(inactive)) found.push(`${selector.includes('toc') ? 'table of contents' : 'progress'}: active state looks like inactive controls`)
      }
      const attribution = document.querySelector('[data-presentation-attribution]')
      if (!attribution || !visible(attribution)) found.push('attribution: link is missing; style [data-presentation-attribution]')
      else {
        const style = getComputedStyle(attribution)
        const browserDefault = style.color === 'rgb(0, 0, 238)' && style.textDecorationLine.includes('underline')
        if (parseFloat(style.fontSize) < 12 || browserDefault) found.push('attribution: link is browser-default or undersized; style [data-presentation-attribution]')
      }
      return found
    })
    for (const warning of diagnostics) warnings.push(`Advisory: step ${stepIndex}: ${warning}`)
    await page.screenshot({ path: `${output}/step-${String(stepIndex + 1).padStart(2, '0')}.png`, fullPage: true })
    if (stepIndex < count - 1) {
      await page.keyboard.press('ArrowRight')
      await page.waitForFunction(expected => Number(document.querySelector('[data-presentation]')?.getAttribute('data-step-index')) === expected, stepIndex + 1)
    }
  }
  if (errors.length) throw new Error(`browser errors: ${errors.join('; ')}`)
  console.log(`Captured ${count} settled steps in ${output}.`)
  for (const warning of [...new Set(warnings)]) console.warn(warning)
} catch (error) {
  console.error(`Inspection failed at step ${stepIndex}: ${error.message}`)
  process.exitCode = 1
} finally {
  await browser?.close()
  preview.kill('SIGTERM')
}
