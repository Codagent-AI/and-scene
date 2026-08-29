import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { setTimeout as delay } from 'node:timers/promises'
import { chromium } from 'playwright'

const slug = process.argv[2]
const host = '127.0.0.1'
const port = 4174
const settleMs = 750

async function waitForPreview(url) {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      if ((await fetch(url)).ok) return
    } catch {
      // The preview process is still starting.
    }
    await delay(250)
  }
  throw new Error(`Preview did not become ready at ${url}`)
}

function overlapWarnings(index) {
  const chrome = '[data-presentation-header], [data-presentation-footer], [data-presentation-toc], [data-presentation-attribution]'
  const rect = (element) => element.getBoundingClientRect()
  const intersects = (first, second) => first.left < second.right && first.right > second.left && first.top < second.bottom && first.bottom > second.top
  return Array.from(document.querySelectorAll(chrome)).flatMap((first, firstIndex, all) =>
    all.slice(firstIndex + 1).flatMap((second) => {
      if (first.closest('[data-presentation-allow-overlap]') || second.closest('[data-presentation-allow-overlap]')) return []
      const a = rect(first)
      const b = rect(second)
      return a.width && a.height && b.width && b.height && intersects(a, b)
        ? [`step ${index + 1}: chrome overlap between ${first.dataset.presentationHeader ?? first.dataset.presentationFooter ?? first.dataset.presentationToc ?? 'attribution'} and ${second.dataset.presentationHeader ?? second.dataset.presentationFooter ?? second.dataset.presentationToc ?? 'attribution'}`]
        : []
    }),
  )
}

if (!slug) throw new Error('Usage: npm run inspect -- <presentation-slug>')

let preview
let browser
try {
  preview = spawn('npm', ['run', 'preview', '--', '--host', host, '--port', String(port)], { stdio: 'inherit' })
  await waitForPreview(`http://${host}:${port}/`)
  browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  await page.goto(`http://${host}:${port}/${slug}`, { waitUntil: 'networkidle' })
  const root = page.locator('[data-presentation]')
  await root.waitFor()
  const count = Number(await root.getAttribute('data-step-count'))
  const artifactDirectory = resolve('artifacts', 'presentation-inspection', slug)
  await mkdir(artifactDirectory, { recursive: true })

  for (let index = 0; index < count; index += 1) {
    await delay(settleMs)
    await page.screenshot({ path: resolve(artifactDirectory, `step-${String(index + 1).padStart(2, '0')}.png`), fullPage: true })
    for (const warning of await page.evaluate(overlapWarnings, index)) console.warn(`INSPECT WARN: ${warning}`)
    const chromeWarning = await page.evaluate(() => {
      const active = document.querySelector('[data-presentation-progress-active="true"], [data-presentation-toc-active="true"]')
      const inactive = document.querySelector('[data-presentation-progress] button:not([data-presentation-progress-active]), [data-presentation-toc] button:not([data-presentation-toc-active])')
      return active && inactive && getComputedStyle(active).cssText === getComputedStyle(inactive).cssText
        ? 'active navigation is visually indistinct' : null
    })
    if (chromeWarning) console.warn(`INSPECT WARN: step ${index + 1}: ${chromeWarning}`)
    const attributionWarning = await page.evaluate(() => {
      const attribution = document.querySelector('[data-presentation-attribution]')
      if (!attribution) return 'attribution is missing'
      const style = getComputedStyle(attribution)
      return Number.parseFloat(style.fontSize) < 10 || (style.color === 'rgb(0, 0, 238)' && style.textDecorationLine.includes('underline'))
        ? 'attribution needs presentation-owned styling' : null
    })
    if (attributionWarning) console.warn(`INSPECT WARN: step ${index + 1}: ${attributionWarning}`)
    if (index < count - 1) await page.keyboard.press('ArrowRight')
  }
  console.log(`INSPECT PASS: screenshots written to ${artifactDirectory}`)
} finally {
  await browser?.close()
  if (preview) {
    preview.kill('SIGTERM')
    await once(preview, 'exit').catch(() => undefined)
  }
}
