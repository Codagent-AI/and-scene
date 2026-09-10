import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { setTimeout as delay } from 'node:timers/promises'
import { chromium } from 'playwright'

const slug = process.argv[2]?.replace(/^\/+|\/+$/g, '')
if (!slug) throw new Error('Usage: npm run inspect -- <presentation-slug>')

const host = '127.0.0.1'
const port = 4174
const settleMs = 650
const outputDirectory = resolve(process.cwd(), 'inspection', slug)
const warn = (step, message) => console.warn(`VISUAL WARNING step ${step + 1}: ${message}`)

async function ready(url) {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try { if ((await fetch(url)).ok) return } catch { /* preview is starting */ }
    await delay(125)
  }
  throw new Error(`Preview did not become ready at ${url}`)
}

const preview = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', host, '--port', String(port), '--strictPort'], { stdio: 'inherit' })
const previewExited = once(preview, 'exit')
try {
  const url = `http://${host}:${port}/${slug}`
  await ready(url)
  await mkdir(outputDirectory, { recursive: true })
  const browser = await chromium.launch({ headless: true })
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
    await page.goto(url, { waitUntil: 'networkidle' })
    const root = page.locator('[data-presentation-root]')
    const count = Number(await root.getAttribute('data-step-count'))
    if (!Number.isInteger(count) || count < 1) throw new Error(`Route /${slug} did not render a presentation`)
    for (let index = 0; index < count; index += 1) {
      await page.waitForFunction((expected) => document.querySelector('[data-presentation-root]')?.getAttribute('data-step-index') === expected, String(index))
      await delay(settleMs)
      await page.screenshot({ path: resolve(outputDirectory, `${String(index + 1).padStart(2, '0')}.png`), fullPage: true })
      const diagnostics = await page.evaluate(() => {
        const visible = (element) => { const style = getComputedStyle(element); const box = element.getBoundingClientRect(); return style.visibility !== 'hidden' && style.display !== 'none' && Number(style.opacity) > 0 && box.width > 0 && box.height > 0 }
        const textElements = [...document.querySelectorAll('[data-presentation-canvas-host] *, [data-presentation-header] *, [data-presentation-footer] *, [data-presentation-toc] *, [data-presentation-mode-toggle]')].filter((element) => visible(element) && element.children.length === 0 && [...element.childNodes].some((node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim()))
        const overlap = (a, b) => { const x = a.getBoundingClientRect(); const y = b.getBoundingClientRect(); return x.left < y.right && x.right > y.left && x.top < y.bottom && x.bottom > y.top }
        const permitted = (element) => Boolean(element.closest('[data-presentation-allow-overlap="true"]'))
        const collisions = []
        for (let a = 0; a < textElements.length; a += 1) for (let b = a + 1; b < textElements.length; b += 1) {
          if (!permitted(textElements[a]) && !permitted(textElements[b]) && overlap(textElements[a], textElements[b])) collisions.push(`${textElements[a].textContent?.trim().slice(0, 30)} / ${textElements[b].textContent?.trim().slice(0, 30)}`)
        }
        const activeControls = [...document.querySelectorAll('[data-presentation-active="true"]')]
        const indistinct = activeControls.some((active) => {
          const inactive = [...active.parentElement?.querySelectorAll('button') ?? []].find((candidate) => candidate !== active)
          if (!inactive) return false
          const a = getComputedStyle(active); const b = getComputedStyle(inactive)
          return a.color === b.color && a.backgroundColor === b.backgroundColor && a.borderColor === b.borderColor && a.fontWeight === b.fontWeight && a.opacity === b.opacity
        })
        const attribution = document.querySelector('[data-presentation-attribution]')
        const attributionStyle = attribution ? getComputedStyle(attribution) : null
        return {
          collisions,
          noActiveState: Boolean(document.querySelector('[data-presentation-progress], [data-presentation-toc]')) && activeControls.length === 0,
          indistinct,
          attribution: attribution ? { linked: attribution instanceof HTMLAnchorElement && Boolean(attribution.getAttribute('href')), fontSize: Number.parseFloat(attributionStyle?.fontSize ?? '0'), browserDefault: attributionStyle?.color === 'rgb(0, 0, 238)' } : null,
        }
      })
      if (diagnostics.collisions.length) warn(index, `unmarked visible text/chrome overlap: ${diagnostics.collisions[0]}`)
      if (diagnostics.noActiveState || diagnostics.indistinct) warn(index, 'active progress or table-of-contents state is visually indistinct')
      if (!diagnostics.attribution) warn(index, 'missing data-presentation-attribution')
      else if (!diagnostics.attribution.linked || diagnostics.attribution.fontSize < 12 || diagnostics.attribution.browserDefault) warn(index, 'attribution is unlinked, undersized, or browser-default styled')
      if (index + 1 < count) await page.keyboard.press('ArrowRight')
    }
  } finally {
    await browser.close()
  }
  console.log(`Captured ${slug} screenshots in ${outputDirectory}`)
} finally {
  if (preview.exitCode === null && preview.signalCode === null) preview.kill('SIGTERM')
  await previewExited.catch(() => undefined)
}
