import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
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
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try { if ((await fetch(baseUrl)).ok) return } catch { /* starting */ }
    await delay(100)
  }
  throw new Error(`preview did not become ready at ${baseUrl}`)
}

function overlap(a, b) {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y
}

async function inspect() {
  const output = join('artifacts', 'presentation-inspection', slug)
  await mkdir(output, { recursive: true })
  const server = spawn(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['vite', 'preview', '--host', host, '--port', String(port), '--strictPort'], { stdio: 'inherit' })
  try {
    await waitForPreview()
    const browser = await chromium.launch()
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
    await page.goto(`${baseUrl}/${slug}`, { waitUntil: 'networkidle' })
    const root = page.locator('[data-presentation-root]')
    const count = Number(await root.getAttribute('data-step-count'))
    for (let index = 0; index < count; index += 1) {
      await page.waitForTimeout(settleMs)
      await page.screenshot({ path: join(output, `step-${String(index + 1).padStart(2, '0')}.png`), fullPage: true })
      const warnings = await page.evaluate(() => {
        const visible = [...document.querySelectorAll('[data-presentation-root] *')].filter((node) => {
          const element = node
          const style = getComputedStyle(element)
          return style.visibility !== 'hidden' && style.display !== 'none' && element.getBoundingClientRect().width > 0 && element.getBoundingClientRect().height > 0
        })
        const chrome = visible.filter((element) => element.matches('[data-presentation-caption], [data-presentation-progress], [data-presentation-controls], [data-presentation-toc], [data-presentation-attribution]'))
        const text = visible.filter((element) => element.childElementCount === 0 && element.textContent?.trim())
        const flagged = []
        for (const item of [...text, ...chrome]) for (const other of [...text, ...chrome]) {
          if (item === other || item.contains(other) || other.contains(item) || item.closest('[data-presentation-allow-overlap]') || other.closest('[data-presentation-allow-overlap]')) continue
          const a = item.getBoundingClientRect(); const b = other.getBoundingClientRect()
          if (a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top) flagged.push(`${item.tagName.toLowerCase()} overlaps ${other.tagName.toLowerCase()}`)
        }
        const active = document.querySelectorAll('[data-presentation-active]')
        const inactive = document.querySelector('[data-presentation-progress-item]:not([data-presentation-active]), [data-presentation-toc-item]:not([data-presentation-active])')
        if (active.length && inactive && [...active].some((item) => getComputedStyle(item).cssText === getComputedStyle(inactive).cssText)) flagged.push('active progress or table-of-contents state may be visually indistinct')
        const attribution = document.querySelector('[data-presentation-attribution]')
        if (!attribution) flagged.push('missing attribution; style [data-presentation-attribution] locally')
        else { const style = getComputedStyle(attribution); if (Number.parseFloat(style.fontSize) < 10 || style.color === 'rgb(0, 0, 238)') flagged.push('attribution appears undersized or browser-default; style [data-presentation-attribution] locally') }
        return [...new Set(flagged)]
      })
      for (const warning of warnings) console.warn(`INSPECT WARNING step ${index + 1}: ${warning}`)
      if (index < count - 1) await page.keyboard.press('ArrowRight')
    }
    await browser.close()
    console.log(`INSPECT COMPLETE: screenshots written to ${output}`)
  } finally {
    if (!server.killed) server.kill('SIGTERM')
    await once(server, 'exit').catch(() => undefined)
  }
}

inspect().catch((error) => { console.error(error); process.exitCode = 1 })
