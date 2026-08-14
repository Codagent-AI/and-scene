import { execFileSync, spawn } from 'node:child_process'
import { mkdir } from 'node:fs/promises'
import { once } from 'node:events'
import { join } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { chromium } from 'playwright'

const slug = process.argv[2]
const host = '127.0.0.1'
const port = 4174
const baseUrl = `http://${host}:${port}`
const settleMs = 700

if (!slug) {
  console.error('Usage: npm run inspect -- <presentation-slug>')
  process.exit(1)
}

async function waitForPreview() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try { if ((await fetch(baseUrl)).ok) return } catch { /* preview is starting */ }
    await delay(100)
  }
  throw new Error(`preview did not become ready at ${baseUrl}`)
}

async function inspect() {
  execFileSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'build'], { stdio: 'inherit' })
  const output = join('artifacts', 'presentation-inspection', slug)
  await mkdir(output, { recursive: true })
  const server = spawn(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['vite', 'preview', '--host', host, '--port', String(port), '--strictPort'], { stdio: 'inherit' })
  let browser
  try {
    await waitForPreview()
    browser = await chromium.launch()
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
    await page.goto(`${baseUrl}/${slug}`, { waitUntil: 'networkidle' })
    const root = page.locator('[data-presentation-root]')
    const count = Number(await root.getAttribute('data-step-count'))
    if (!Number.isInteger(count) || count < 1) throw new Error(`presentation route /${slug} did not expose data-step-count`)

    for (let index = 0; index < count; index += 1) {
      await page.waitForTimeout(settleMs)
      await page.screenshot({ path: join(output, `step-${String(index + 1).padStart(2, '0')}.png`), fullPage: true })
      const warnings = await page.evaluate(() => {
        const isVisible = (element) => {
          const style = getComputedStyle(element)
          const rect = element.getBoundingClientRect()
          return style.visibility !== 'hidden' && style.display !== 'none' && Number(style.opacity) > 0 && rect.width > 0 && rect.height > 0
        }
        const isAllowed = (element) => Boolean(element.closest('[data-presentation-allow-overlap]'))
        const overlaps = (a, b) => {
          const one = a.getBoundingClientRect(); const two = b.getBoundingClientRect()
          return one.left < two.right && one.right > two.left && one.top < two.bottom && one.bottom > two.top
        }
        const visible = [...document.querySelectorAll('[data-presentation-root] *')].filter(isVisible)
        const text = visible.filter((element) => element.children.length === 0 && element.textContent?.trim())
        const chrome = visible.filter((element) => element.matches('[data-presentation-caption], [data-presentation-progress-item], [data-presentation-controls] > button, [data-presentation-toc-item], [data-presentation-attribution]'))
        const candidates = [...new Set([...text, ...chrome])]
        const flagged = []
        for (let first = 0; first < candidates.length; first += 1) for (let second = first + 1; second < candidates.length; second += 1) {
          const a = candidates[first]; const b = candidates[second]
          if (a.contains(b) || b.contains(a) || isAllowed(a) || isAllowed(b) || !overlaps(a, b)) continue
          flagged.push(`${a.tagName.toLowerCase()} overlaps ${b.tagName.toLowerCase()}`)
        }
        for (const selector of ['[data-presentation-progress-item]', '[data-presentation-toc-item]']) {
          const active = document.querySelector(`${selector}[data-presentation-active]`)
          const inactive = document.querySelector(`${selector}:not([data-presentation-active])`)
          if (active && inactive) {
            const fields = ['color', 'backgroundColor', 'borderColor', 'fontWeight', 'opacity']
            const alike = fields.every((field) => getComputedStyle(active)[field] === getComputedStyle(inactive)[field])
            if (alike) flagged.push(`active ${selector.includes('progress') ? 'progress' : 'table-of-contents'} state may be visually indistinct`)
          }
        }
        const attribution = document.querySelector('[data-presentation-attribution]')
        if (!attribution) flagged.push('missing attribution; style [data-presentation-attribution] locally')
        else {
          const style = getComputedStyle(attribution)
          if (Number.parseFloat(style.fontSize) < 10 || style.color === 'rgb(0, 0, 238)') flagged.push('attribution appears undersized or browser-default; style [data-presentation-attribution] locally')
        }
        return [...new Set(flagged)]
      })
      for (const warning of warnings) console.warn(`INSPECT WARNING step ${index + 1}: ${warning}`)
      if (index < count - 1) await page.keyboard.press('ArrowRight')
    }
    console.log(`INSPECT COMPLETE: screenshots written to ${output}`)
  } finally {
    await browser?.close()
    if (!server.killed) server.kill('SIGTERM')
    await once(server, 'exit').catch(() => undefined)
  }
}

inspect().catch((error) => { console.error(`INSPECT FAILED: ${error instanceof Error ? error.message : String(error)}`); process.exitCode = 1 })
