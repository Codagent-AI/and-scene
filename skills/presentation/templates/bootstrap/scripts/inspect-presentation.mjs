import { mkdir } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'
import { chromium } from 'playwright'

const slug = process.argv[2]
const host = '127.0.0.1'
const port = '4174'
const settleMs = 700

async function ready(url) {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try { if ((await fetch(url)).ok) return } catch { /* preview is not listening yet */ }
    await delay(150)
  }
  throw new Error(`preview did not become ready at ${url}`)
}

function overlaps(a, b) {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y
}

if (!slug) {
  console.error('INSPECT FAIL: provide a registered presentation slug: npm run inspect -- <slug>')
  process.exitCode = 1
} else {
  const output = `artifacts/inspection/${slug}`
  let preview
  let browser
  try {
    await mkdir(output, { recursive: true })
    preview = spawn('npm', ['run', 'preview', '--', '--host', host, '--port', port], { stdio: 'ignore' })
    const url = `http://${host}:${port}/${slug}`
    await ready(url)
    browser = await chromium.launch({ headless: true })
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
    await page.goto(url, { waitUntil: 'networkidle' })
    const root = page.locator('[data-presentation-root]')
    const count = Number(await root.getAttribute('data-step-count'))
    if (!Number.isInteger(count) || count < 1) throw new Error(`route /${slug} did not expose a positive data-step-count`)

    for (let index = 0; index < count; index += 1) {
      await page.waitForTimeout(settleMs)
      await page.screenshot({ path: `${output}/step-${String(index + 1).padStart(2, '0')}.png`, fullPage: true })
      const warnings = await page.evaluate(() => {
        const visible = (element) => {
          const style = getComputedStyle(element)
          const box = element.getBoundingClientRect()
          return style.display !== 'none' && style.visibility !== 'hidden' && box.width > 0 && box.height > 0
        }
        const result = []
        const caption = document.querySelector('[data-presentation-caption]')
        if (caption && visible(caption)) {
          const captionBox = caption.getBoundingClientRect()
          for (const element of document.querySelectorAll('[data-presentation-header], [data-presentation-stage], [data-presentation-toc], [data-presentation-progress-list], [data-presentation-prev], [data-presentation-next]')) {
            if (visible(element) && !element.closest('[data-allow-overlap]') && !caption.closest('[data-allow-overlap]')) {
              const box = element.getBoundingClientRect()
              if (captionBox.left < box.right && captionBox.right > box.left && captionBox.top < box.bottom && captionBox.bottom > box.top) result.push('possible text/chrome overlap')
            }
          }
        }
        const active = document.querySelector('[data-presentation-progress][data-active="true"], [data-presentation-toc-entry][data-active="true"]')
        if (active && getComputedStyle(active).color === getComputedStyle(active.parentElement?.querySelector('button:not([data-active="true"])') ?? active).color) result.push('active navigation may be visually indistinct')
        const attribution = document.querySelector('[data-presentation-attribution]')
        if (!attribution || getComputedStyle(attribution).fontSize === '16px') result.push('attribution is missing, browser-default, or undersized; style [data-presentation-attribution] locally')
        return [...new Set(result)]
      })
      warnings.forEach((warning) => console.warn(`INSPECT WARNING step ${index + 1}: ${warning}`))
      if (index < count - 1) await page.keyboard.press('ArrowRight')
    }
    console.log(`INSPECT PASS: wrote ${count} settled screenshots to ${output}`)
  } catch (error) {
    console.error(`INSPECT FAIL: ${error instanceof Error ? error.message : String(error)}`)
    process.exitCode = 1
  } finally {
    await browser?.close()
    preview?.kill('SIGTERM')
  }
}
