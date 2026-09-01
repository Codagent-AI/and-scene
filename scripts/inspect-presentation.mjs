import { mkdir } from 'node:fs/promises'
import { spawn, spawnSync } from 'node:child_process'
import { join } from 'node:path'

const host = '127.0.0.1'
const port = Number(process.env.PRESENTATION_INSPECT_PORT ?? 4174)
const slug = process.argv[2]
const settleMs = Number(process.env.PRESENTATION_SETTLE_MS ?? 750)

if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error('Usage: npm run inspect -- <presentation-slug>')

function run(command, args) {
  const result = spawnSync(command, args, { stdio: 'inherit' })
  if (result.status !== 0) throw new Error(`${command} ${args.join(' ')} failed`)
}

async function waitForServer(url) {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try { if ((await fetch(url)).ok) return } catch { /* preview is still starting */ }
    await new Promise((resolve) => setTimeout(resolve, 250))
  }
  throw new Error(`Timed out waiting for ${url}`)
}

async function diagnostics(page) {
  return page.evaluate(() => {
    const visible = (element) => {
      const style = getComputedStyle(element)
      const rect = element.getBoundingClientRect()
      return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) > 0 && rect.width > 0 && rect.height > 0
    }
    const allowed = (element) => Boolean(element.closest('[data-presentation-allow-overlap]'))
    const candidates = [...document.querySelectorAll('[data-presentation-caption], [data-presentation-header], [data-presentation-progress], [data-presentation-toc], [data-presentation-step-controls], [data-presentation-attribution], [data-presentation-step-title]')]
      .filter((element) => visible(element) && !allowed(element))
    const overlaps = []
    for (let left = 0; left < candidates.length; left += 1) {
      for (let right = left + 1; right < candidates.length; right += 1) {
        const a = candidates[left]
        const b = candidates[right]
        if (a.contains(b) || b.contains(a)) continue
        const ar = a.getBoundingClientRect()
        const br = b.getBoundingClientRect()
        if (ar.left < br.right && ar.right > br.left && ar.top < br.bottom && ar.bottom > br.top) {
          overlaps.push(`${a.getAttributeNames().find((name) => name.startsWith('data-presentation-')) ?? a.tagName} ↔ ${b.getAttributeNames().find((name) => name.startsWith('data-presentation-')) ?? b.tagName}`)
        }
      }
    }
    const indistinct = (selector, activeSelector) => {
      const active = document.querySelector(activeSelector)
      const inactive = [...document.querySelectorAll(selector)].find((element) => element !== active)
      if (!active || !inactive || !visible(active) || !visible(inactive)) return false
      const a = getComputedStyle(active)
      const b = getComputedStyle(inactive)
      return ['color', 'backgroundColor', 'borderColor', 'fontWeight', 'opacity', 'transform'].every((property) => a[property] === b[property])
    }
    const attribution = document.querySelector('[data-presentation-attribution="true"]')
    let attributionWarning
    if (!attribution || document.querySelectorAll('[data-presentation-attribution="true"]').length !== 1) attributionWarning = 'missing or ambiguous attribution'
    else {
      const style = getComputedStyle(attribution)
      const defaultBlue = style.color === 'rgb(0, 0, 238)' && style.textDecorationLine.includes('underline')
      if (Number.parseFloat(style.fontSize) < 10 || defaultBlue) attributionWarning = 'browser-default or undersized attribution'
    }
    return {
      overlaps,
      indistinctProgress: indistinct('[data-presentation-progress] button', '[data-presentation-progress-active="true"]'),
      indistinctToc: indistinct('[data-presentation-toc] button', '[data-presentation-toc-active="true"]'),
      attributionWarning,
    }
  })
}

run('npm', ['run', 'build'])
await mkdir(join('inspection-artifacts', slug), { recursive: true })
const preview = spawn('npm', ['run', 'preview', '--', '--host', host, '--port', String(port), '--strictPort'], { stdio: 'inherit' })
let browser
try {
  const url = `http://${host}:${port}/${slug}`
  await waitForServer(url)
  const { chromium } = await import('playwright')
  browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  await page.goto(url, { waitUntil: 'networkidle' })
  const chrome = page.locator('[data-presentation-chrome="true"]')
  const count = Number(await chrome.getAttribute('data-step-count'))
  if (!Number.isInteger(count) || count < 1) throw new Error('Presentation did not expose a valid step count.')
  for (let index = 0; index < count; index += 1) {
    await page.waitForTimeout(settleMs)
    const warnings = await diagnostics(page)
    for (const overlap of warnings.overlaps) console.warn(`WARN step ${index + 1}: unmarked text/chrome overlap: ${overlap}`)
    if (warnings.indistinctProgress) console.warn(`WARN step ${index + 1}: active progress state is visually indistinct.`)
    if (warnings.indistinctToc) console.warn(`WARN step ${index + 1}: active table-of-contents state is visually indistinct.`)
    if (warnings.attributionWarning) console.warn(`WARN step ${index + 1}: ${warnings.attributionWarning}; style [data-presentation-attribution].`)
    await page.screenshot({ path: join('inspection-artifacts', slug, `${String(index + 1).padStart(2, '0')}.png`), fullPage: true })
    if (index < count - 1) await page.keyboard.press('ArrowRight')
  }
  console.log(`Captured ${count} settled screenshots in inspection-artifacts/${slug}/.`)
} finally {
  await browser?.close()
  preview.kill('SIGTERM')
}
