import { spawn } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'
import { mkdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const host = '127.0.0.1'
const port = Number(process.env.PORT || 4173)
const route = process.argv[2] || process.env.PRESENTATION_ROUTE || '/how-to-make-a-presentation'
const pathname = `/${route.replace(/^\/+/, '')}`
const output = resolve(root, process.env.SCREENSHOT_DIR || `artifacts/presentation-inspection/${pathname.slice(1).replaceAll('/', '-')}`)
const origin = `http://${host}:${port}`
let preview
let browser
let browserLaunch
function startPreview() {
  const child = spawn(process.execPath, [resolve(root, 'node_modules/vite/bin/vite.js'), 'preview', '--host', host, '--port', String(port), '--strictPort'], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] })
  let announced = false
  let output = ''
  let rejectFailure
  const failed = new Promise((_, reject) => { rejectFailure = reject })
  const ready = new Promise((resolveReady, rejectReady) => {
    const readinessTimeout = Number(process.env.PREVIEW_READINESS_TIMEOUT_MS || 20000)
    const timer = setTimeout(() => {
      const error = new Error(`Preview readiness timed out after ${readinessTimeout}ms`)
      rejectReady(error)
      rejectFailure(error)
    }, readinessTimeout)
    const clearReadinessTimer = () => clearTimeout(timer)
    child.stdout.on('data', (chunk) => {
      const text = chunk.toString()
      process.stdout.write(text)
      output += text.replace(/\u001b\[[0-9;]*m/g, '')
      if (output.includes(`${origin}/`)) { announced = true; clearReadinessTimer(); resolveReady() }
    })
    child.stderr.on('data', (chunk) => process.stderr.write(chunk))
    child.once('error', (error) => { clearReadinessTimer(); rejectReady(error); rejectFailure(error) })
    child.once('exit', (code, signal) => {
      clearReadinessTimer()
      const error = new Error(`vite preview exited ${announced ? 'unexpectedly' : 'before readiness'} (code ${code ?? 'none'}, signal ${signal ?? 'none'})`)
      rejectFailure(error)
      if (!announced) rejectReady(error)
    })
  })
  return {
    child,
    ready: Promise.race([ready, failed]),
    failed,
    assertAlive() { if (child.exitCode !== null) throw new Error(`vite preview exited unexpectedly with code ${child.exitCode}`) },
  }
}
try {
  const startup = startPreview()
  preview = startup.child
  await startup.ready
  startup.assertAlive()
  await Promise.race([captureSteps(startup), startup.failed])

} catch (error) {
  console.error(`INSPECTION FAILED: ${error.message}`)
  process.exitCode = 1
} finally {
  const launchedBrowser = browser ?? await browserLaunch?.catch(() => undefined)
  await launchedBrowser?.close()
  if (preview && preview.exitCode === null) {
    preview.kill('SIGTERM')
    await Promise.race([new Promise((resolveExit) => preview.once('exit', resolveExit)), delay(3000)])
    if (preview.exitCode === null) preview.kill('SIGKILL')
  }
}

async function captureSteps(startup) {
    const readiness = await fetch(origin)
    if (!readiness.ok) throw new Error(`preview readiness probe failed at ${origin}: HTTP ${readiness.status}`)
    await mkdir(output, { recursive: true })
    browserLaunch = chromium.launch({ headless: true })
    browser = await browserLaunch
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
    const errors = []
    page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
    page.on('pageerror', (error) => errors.push(error.message))
    await page.goto(`${origin}${pathname}`, { waitUntil: 'networkidle' })
    const rootNode = page.locator('[data-presentation-root]')
    await rootNode.waitFor({ state: 'visible' })
    const rawCount = await rootNode.getAttribute('data-step-count')
    const count = Number(rawCount)
    if (rawCount === null || !Number.isSafeInteger(count) || count < 1) throw new Error(`Invalid data-step-count: ${rawCount}`)
    for (let index = 0; index < count; index++) {
      if (index > 0) {
        await page.keyboard.press('ArrowRight')
        await page.waitForFunction((wanted) => Number(document.querySelector('[data-step-index]')?.getAttribute('data-step-index')) === wanted, index, { timeout: 3000 })
      }
      await page.waitForTimeout(Number(process.env.INSPECT_SETTLE_MS || 1100))
      if (Number(await rootNode.getAttribute('data-step-index')) !== index) throw new Error(`expected step ${index}, found another index`)
      const file = resolve(output, `step-${String(index + 1).padStart(2, '0')}.png`)
      await page.screenshot({ path: file, fullPage: true })
      const warnings = await page.evaluate(() => {
        const result = []
        const allowed = (element) => Boolean(element.closest('[data-presentation-allow-overlap]'))
        const name = (element) => element.getAttribute('aria-label') || element.getAttribute('data-entity-id') || element.getAttribute('data-presentation-node') || element.getAttribute('data-presentation-chrome') || element.textContent?.trim().replace(/\s+/g, ' ').slice(0, 42) || element.tagName.toLowerCase()
        const visible = (el) => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && Number(s.opacity) > 0.05 }
        const texts = [...document.querySelectorAll('body *')].filter((el) => el.children.length === 0 && el.textContent?.trim() && visible(el) && !allowed(el))
        const chrome = [...document.querySelectorAll('[data-presentation-title], [data-presentation-step-title], [data-presentation-caption], [data-presentation-toc-item], [data-presentation-navigation], [data-presentation-mode-toggle], [data-presentation-attribution]')].filter(visible)
        const intersects = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top
        let overlaps = 0
        for (const text of texts) for (const item of chrome) {
          if (text === item || text.contains(item) || item.contains(text) || allowed(item)) continue
          if (intersects(text.getBoundingClientRect(), item.getBoundingClientRect())) {
            result.push(`unmarked visible text/chrome overlap: “${name(text)}” with “${name(item)}”`)
            if (++overlaps >= 5) break
          }
        }
        const active = [...document.querySelectorAll('[data-presentation-progress-item][aria-current="step"], [data-presentation-toc-item][aria-current="step"]')]
        for (const element of active) {
          const style = getComputedStyle(element)
          const peer = element.parentElement?.querySelector('[data-presentation-progress-item]:not([aria-current="step"]), [data-presentation-toc-item]:not([aria-current="step"])')
          if (!peer) continue
          const other = getComputedStyle(peer)
          const same = style.color === other.color && style.backgroundColor === other.backgroundColor && style.borderColor === other.borderColor && style.fontWeight === other.fontWeight && style.textDecorationLine === other.textDecorationLine
          if (same) result.push(`active ${element.hasAttribute('data-presentation-toc-item') ? 'table of contents' : 'progress'} state is visually indistinct`)
        }
        const attribution = document.querySelector('[data-presentation-attribution]')
        if (!attribution) result.push('missing attribution (style [data-presentation-attribution])')
        else {
          const style = getComputedStyle(attribution)
          if (parseFloat(style.fontSize) < 10) result.push('attribution is undersized (style [data-presentation-attribution])')
          if (style.fontSize === '16px' && style.color === 'rgb(0, 0, 0)' && attribution.tagName === 'A' && !style.textDecorationLine.includes('underline')) result.push('attribution may use browser-default styling (style [data-presentation-attribution])')
        }
        return [...new Set(result)]
      })
      for (const warning of warnings) console.warn(`Advisory step ${index}: ${warning}`)
      if (errors.length) throw new Error(`browser error on step ${index}: ${errors[0]}`)
    }
    console.log(`Captured ${count} settled screenshots in ${output}`)
}
