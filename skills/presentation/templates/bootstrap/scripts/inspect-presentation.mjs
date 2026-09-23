import { spawn } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'
import { mkdir } from 'node:fs/promises'
import { chromium } from 'playwright'

const host = '127.0.0.1'
const port = Number(process.env.PORT || 4179)
const slug = process.argv[2]
if (!slug) throw new Error('Usage: npm run inspect -- <presentation-slug>')
const server = spawn('npm', ['run', 'preview', '--', '--host', host, '--port', String(port), '--strictPort'], { stdio: 'ignore' })
let browser
try {
  for (let i = 0; i < 80; i++) {
    try { if ((await fetch(`http://${host}:${port}/${slug}`)).ok) break } catch {}
    if (i === 79) throw new Error('Preview did not become ready')
    await delay(250)
  }
  browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  const errors = []
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
  page.on('pageerror', error => errors.push(error.message))
  await page.goto(`http://${host}:${port}/${slug}`, { waitUntil: 'networkidle' })
  const count = Number(await page.locator('[data-step-count]').getAttribute('data-step-count'))
  await mkdir('artifacts/inspection', { recursive: true })
  for (let index = 0; index < count; index++) {
    await page.waitForTimeout(700)
    await page.screenshot({ path: `artifacts/inspection/${slug}-${index + 1}.png`, fullPage: true })
    const current = Number(await page.locator('[data-step-index]').getAttribute('data-step-index'))
    console.log(`Captured step ${current + 1}/${count}`)
    if (index < count - 1) {
      await page.keyboard.press('ArrowRight')
      await page.waitForFunction(expected => Number(document.querySelector('[data-step-index]')?.getAttribute('data-step-index')) === expected, index + 1)
    }
  }
  const diagnostics = await page.evaluate(() => {
    const warnings = []
    const visible = (element) => {
      const rect = element.getBoundingClientRect()
      const style = getComputedStyle(element)
      return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none'
    }
    const overlaps = (a, b) => {
      const x = a.getBoundingClientRect(), y = b.getBoundingClientRect()
      return x.left < y.right && x.right > y.left && x.top < y.bottom && x.bottom > y.top
    }
    const stage = document.querySelector('[data-presentation-stage-region]')
    const chrome = [...document.querySelectorAll('.presentation-footer, .presentation-toc, .presentation-header')].filter(visible)
    if (stage) {
      const text = [...stage.querySelectorAll('*')].filter(element => visible(element) && element.children.length === 0 && element.textContent?.trim())
      for (const element of text) {
        if (element.closest('[data-presentation-allow-overlap]')) continue
        if (chrome.some(region => overlaps(element, region))) warnings.push(`Unmarked scene text overlaps presentation chrome: ${element.textContent.trim().slice(0, 50)}`)
      }
    }
    const active = document.querySelector('[aria-current="step"], [data-presentation-active="true"]')
    const peers = active?.parentElement ? [...active.parentElement.children].filter(element => element !== active) : []
    if (active && peers.length) {
      const activeStyle = getComputedStyle(active)
      const signatures = new Set([activeStyle.color, activeStyle.backgroundColor, activeStyle.borderColor, activeStyle.fontWeight])
      const distinct = peers.some(element => {
        const style = getComputedStyle(element)
        return style.color !== activeStyle.color || style.backgroundColor !== activeStyle.backgroundColor || style.borderColor !== activeStyle.borderColor || style.fontWeight !== activeStyle.fontWeight
      })
      if (!distinct || signatures.size === 1) warnings.push('Active navigation may not be visually distinct from inactive items')
    }
    const attribution = document.querySelector('[data-presentation-attribution]')
    if (!attribution || !visible(attribution)) warnings.push('Presentation attribution is missing or hidden')
    else {
      const style = getComputedStyle(attribution)
      if (Number.parseFloat(style.fontSize) < 11 || style.color === 'rgb(0, 0, 0)' && style.fontFamily === '"Times New Roman"') warnings.push('Attribution may be undersized or browser-default styled')
    }
    return warnings
  })
  diagnostics.forEach(warning => console.log(`Visual advisory: ${warning}`))
  console.log(`Review settled screenshots in artifacts/inspection for clipped content and visual hierarchy.`)
  if (errors.length) throw new Error(`Browser errors: ${errors.join('; ')}`)
} finally {
  await browser?.close()
  server.kill('SIGTERM')
}
