import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { setTimeout as delay } from 'node:timers/promises'
import { chromium } from 'playwright'

const slug = process.argv[2]
if (!slug) throw new Error('Usage: npm run inspect -- <presentation-slug>')

const host = '127.0.0.1'
const port = 4174
const outputDirectory = resolve(process.cwd(), 'inspection', slug)

function warn(step, message) {
  console.warn(`VISUAL WARNING step ${step + 1}: ${message}`)
}

async function ready(url) {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try { if ((await fetch(url)).ok) return } catch { /* keep polling */ }
    await delay(125)
  }
  throw new Error(`Preview did not become ready at ${url}`)
}

const preview = spawn('npm', ['run', 'preview', '--', '--host', host, '--port', String(port), '--strictPort'], { stdio: 'inherit', shell: process.platform === 'win32' })
try {
  const url = `http://${host}:${port}/${slug.replace(/^\/+/, '')}`
  await ready(url)
  await mkdir(outputDirectory, { recursive: true })
  const browser = await chromium.launch({ headless: true })
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
    await page.goto(url, { waitUntil: 'networkidle' })
    const count = await page.locator('[data-presentation-root]').getAttribute('data-step-count')
    if (!count || Number(count) < 1) throw new Error(`Route /${slug} did not render a presentation`)
    for (let index = 0; index < Number(count); index += 1) {
      await delay(600)
      await page.screenshot({ path: resolve(outputDirectory, `${String(index + 1).padStart(2, '0')}.png`), fullPage: true })
      const diagnostics = await page.evaluate(() => {
        const rect = (selector) => {
          const element = document.querySelector(selector)
          if (!element) return null
          const box = element.getBoundingClientRect()
          return { left: box.left, top: box.top, right: box.right, bottom: box.bottom }
        }
        const overlaps = (a, b) => a && b && a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top
        const root = document.querySelector('[data-presentation-root]')
        const active = document.querySelectorAll('[data-presentation-active="true"]').length
        const attribution = document.querySelector('[data-presentation-attribution]')
        const attributionStyle = attribution ? getComputedStyle(attribution) : null
        return {
          allowedOverlap: Boolean(document.querySelector('[data-presentation-allow-overlap="true"]')),
          chromeOverlap: overlaps(rect('[data-presentation-canvas-host]'), rect('[data-presentation-footer]')) || overlaps(rect('[data-presentation-canvas-host]'), rect('[data-presentation-header]')),
          active,
          hasActiveControls: Boolean(document.querySelector('[data-presentation-progress], [data-presentation-toc]')),
          attribution: attribution ? {
            linked: attribution instanceof HTMLAnchorElement && Boolean(attribution.href),
            fontSize: Number.parseFloat(attributionStyle?.fontSize ?? '0'),
            browserDefault: attributionStyle?.color === 'rgb(0, 0, 238)',
          } : null,
          index: root?.getAttribute('data-step-index'),
        }
      })
      if (diagnostics.chromeOverlap && !diagnostics.allowedOverlap) warn(index, 'scene content overlaps header or footer chrome without data-presentation-allow-overlap')
      if (diagnostics.hasActiveControls && diagnostics.active === 0) warn(index, 'no current progress or table-of-contents control exposes data-presentation-active')
      if (!diagnostics.attribution) warn(index, 'missing data-presentation-attribution')
      else if (!diagnostics.attribution.linked || diagnostics.attribution.fontSize < 12 || diagnostics.attribution.browserDefault) warn(index, 'attribution is unlinked, undersized, or browser-default styled')
      if (index + 1 < Number(count)) {
        await page.keyboard.press('ArrowRight')
        await page.waitForFunction((expected) => document.querySelector('[data-presentation-root]')?.getAttribute('data-step-index') === expected, String(index + 1))
      }
    }
  } finally {
    await browser.close()
  }
  console.log(`Captured presentation screenshots in ${outputDirectory}`)
} finally {
  preview.kill('SIGTERM')
  await once(preview, 'exit').catch(() => undefined)
}
