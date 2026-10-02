import { mkdir } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { setTimeout as delay } from 'node:timers/promises'
import { chromium } from '@playwright/test'

const slug = process.argv[2]
if (!slug) throw new Error('Usage: npm run inspect -- <presentation-slug>')
const host = '127.0.0.1'
const project = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const port = Number(process.env.PREVIEW_PORT ?? 4174)
const base = `http://${host}:${port}`
const preview = spawn(process.execPath, [resolve(project, 'node_modules/vite/bin/vite.js'), 'preview', '--host', host, '--port', String(port), '--strictPort'], { cwd: project, stdio: 'ignore' })
let browser
try {
  for (let i = 0; i < 80; i += 1) {
    try { if ((await fetch(base)).ok) break } catch {}
    await delay(250)
    if (i === 79) throw new Error(`Preview did not start at ${base}`)
  }
  browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
  const errors = []
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto(`${base}/${slug}`, { waitUntil: 'networkidle' })
  const presentation = page.locator('[data-presentation]')
  await presentation.waitFor()
  const total = Number(await presentation.getAttribute('data-step-count'))
  if (!Number.isInteger(total) || total < 1) throw new Error('Presentation does not expose a valid data-step-count')
  const directory = resolve(project, `artifacts/inspection/${slug}`)
  await mkdir(directory, { recursive: true })
  for (let index = 0; index < total; index += 1) {
    if (Number(await presentation.getAttribute('data-step-index')) !== index) {
      await page.keyboard.press('ArrowRight')
      await page.waitForFunction((expected) => Number(document.querySelector('[data-presentation]')?.getAttribute('data-step-index')) === expected, index)
    }
    await delay(Number(process.env.INSPECT_SETTLE_MS ?? 800))
    await page.screenshot({ path: `${directory}/step-${String(index + 1).padStart(2, '0')}.png`, fullPage: true })
    const warnings = await page.evaluate(() => {
      const visible = [...document.querySelectorAll('[data-presentation] *')].filter((node) => {
        const el = node
        const rect = el.getBoundingClientRect()
        return el instanceof HTMLElement && rect.width > 0 && rect.height > 0 && getComputedStyle(el).visibility !== 'hidden' && el.innerText?.trim() && ![...el.children].some((child) => child instanceof HTMLElement && child.innerText.trim())
      })
      const overlaps = []
      for (let a = 0; a < visible.length; a += 1) for (let b = a + 1; b < visible.length; b += 1) {
        const first = visible[a], second = visible[b]
        if (first.closest('[data-allow-overlap]') || second.closest('[data-allow-overlap]') || first.contains(second) || second.contains(first)) continue
        const x = first.getBoundingClientRect(), y = second.getBoundingClientRect()
        if (x.left < y.right && x.right > y.left && x.top < y.bottom && x.bottom > y.top) overlaps.push(`${first.tagName.toLowerCase()} and ${second.tagName.toLowerCase()}`)
      }
      const active = [...document.querySelectorAll('[aria-current="step"], [aria-current="location"], [data-presentation-active]')]
      const attribution = document.querySelector('[data-presentation-attribution]')
      const result = overlaps.length ? [`visible text overlap: ${[...new Set(overlaps)].join(', ')}`] : []
      if (active.some((item) => getComputedStyle(item).color === getComputedStyle(item.parentElement ?? item).color && getComputedStyle(item).fontWeight === '400')) result.push('active navigation may be visually indistinct')
      if (!attribution) result.push('missing attribution')
      else if (parseFloat(getComputedStyle(attribution).fontSize) < 12 || getComputedStyle(attribution).textDecorationLine === 'underline' && getComputedStyle(attribution).color === 'rgb(0, 0, 238)') result.push('attribution may be undersized or browser-default; style [data-presentation-attribution]')
      return result
    })
    for (const warning of warnings) console.warn(`WARN step ${index + 1}: ${warning}`)
    if (errors.length) console.warn(`WARN step ${index + 1}: browser errors: ${errors.splice(0).join('; ')}`)
  }
  console.log(`Captured ${total} settled screenshots in ${directory}`)
} finally {
  await browser?.close()
  preview.kill('SIGTERM')
}
