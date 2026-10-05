import { mkdir } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'

const slug = process.argv[2]
if (!slug) throw new Error('Usage: npm run inspect -- <presentation-slug>')
const port = 4175
const base = `http://127.0.0.1:${port}`
const output = `inspection/${slug}`
const vite = fileURLToPath(new URL('../node_modules/vite/bin/vite.js', import.meta.url))
const server = spawn(process.execPath, [vite, 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { cwd: fileURLToPath(new URL('..', import.meta.url)), stdio: 'ignore' })
let browser
try {
  await mkdir(output, { recursive: true })
  let ready = false
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try { ready = (await fetch(base)).ok; if (ready) break } catch { /* preview is starting */ }
    await delay(250)
  }
  if (!ready) throw new Error('Vite preview did not become ready')
  browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  page.on('console', (message) => { if (message.type() === 'error') console.warn(`Browser console: ${message.text()}`) })
  page.on('pageerror', (error) => console.warn(`Browser error: ${error.message}`))
  await page.goto(`${base}/${slug}`, { waitUntil: 'networkidle' })
  const footer = page.locator('[data-step-count]')
  await footer.waitFor()
  const count = Number(await footer.getAttribute('data-step-count'))
  for (let index = 0; index < count; index += 1) {
    await page.waitForTimeout(700)
    await page.screenshot({ path: `${output}/step-${String(index + 1).padStart(2, '0')}.png`, fullPage: true })
    const diagnostics = await page.evaluate(() => {
      const visible = (element) => {
        const rect = element.getBoundingClientRect()
        const style = getComputedStyle(element)
        return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none'
      }
      const candidates = [...document.querySelectorAll('[data-presentation-node], [data-presentation-caption], [data-presentation-header], [data-presentation-toc], [data-presentation-footer]')]
        .filter((element) => visible(element) && (element.textContent?.trim() || element.hasAttribute('data-presentation-node')))
      const overlaps = []
      for (let first = 0; first < candidates.length; first += 1) {
        for (let second = first + 1; second < candidates.length; second += 1) {
          const a = candidates[first]
          const b = candidates[second]
          if (a.contains(b) || b.contains(a) || a.closest('[data-presentation-allow-overlap]') || b.closest('[data-presentation-allow-overlap]')) continue
          const ar = a.getBoundingClientRect()
          const br = b.getBoundingClientRect()
          const overlapWidth = Math.min(ar.right, br.right) - Math.max(ar.left, br.left)
          const overlapHeight = Math.min(ar.bottom, br.bottom) - Math.max(ar.top, br.top)
          if (overlapWidth > 4 && overlapHeight > 4) overlaps.push(`${a.getAttribute('data-presentation-node') || a.getAttribute('data-presentation-caption') || a.className} overlaps ${b.getAttribute('data-presentation-node') || b.getAttribute('data-presentation-caption') || b.className}`)
        }
      }
      const active = [...document.querySelectorAll('[data-presentation-active="true"]')]
      const indistinct = active.some((element) => {
        const peers = [...element.parentElement.querySelectorAll('[data-presentation-active="false"]')]
        if (!peers.length) return false
        const activeStyle = getComputedStyle(element)
        const inactiveStyle = getComputedStyle(peers[0])
        return activeStyle.color === inactiveStyle.color && activeStyle.backgroundColor === inactiveStyle.backgroundColor && activeStyle.borderColor === inactiveStyle.borderColor && activeStyle.fontWeight === inactiveStyle.fontWeight && activeStyle.opacity === inactiveStyle.opacity
      })
      const attribution = document.querySelector('[data-presentation-attribution]')
      let unpolishedAttribution = false
      if (attribution && visible(attribution)) {
        const style = getComputedStyle(attribution)
        unpolishedAttribution = Number.parseFloat(style.fontSize) < 11 || style.color === 'rgb(0, 0, 238)'
      }
      return { overlaps, indistinct, unpolishedAttribution }
    })
    for (const overlap of diagnostics.overlaps) console.warn(`step ${index + 1}: possible overlap: ${overlap}`)
    if (diagnostics.indistinct) console.warn(`step ${index + 1}: active progress or table-of-contents state may be indistinct`)
    if (diagnostics.unpolishedAttribution) console.warn(`step ${index + 1}: attribution appears too small or browser-default; style [data-presentation-attribution]`)
    if (index < count - 1) {
      await page.keyboard.press('ArrowRight')
      await page.waitForFunction((expected) => Number(document.querySelector('[data-step-index]')?.getAttribute('data-step-index')) === expected, index + 1)
    }
  }
  console.log(`Captured ${count} settled step screenshots in ${output}/; review scene and chrome composition visually.`)
} finally {
  await browser?.close()
  server.kill('SIGTERM')
  await new Promise((resolve) => server.once('close', resolve))
}
