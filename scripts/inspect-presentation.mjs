import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { createServer } from 'node:net'
import { spawn } from 'node:child_process'
import { chromium } from 'playwright'

const host = '127.0.0.1'
const slug = process.argv[2]
const settleMs = Number(process.env.PRESENTATION_SETTLE_MS ?? 750)
if (!slug) throw new Error('Usage: npm run inspect -- <presentation-slug>')

function availablePort() {
  return new Promise((resolvePort, reject) => {
    const server = createServer()
    server.once('error', reject)
    server.listen(0, host, () => {
      const address = server.address()
      server.close((error) => error ? reject(error) : resolvePort(address.port))
    })
  })
}

async function waitFor(url) {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      if ((await fetch(url)).ok) return
    } catch {
      // The preview process is still starting.
    }
    await new Promise((resolveWait) => setTimeout(resolveWait, 100))
  }
  throw new Error(`preview did not become ready at ${url}`)
}

function stopProcess(child) {
  if (!child?.pid || child.exitCode !== null) return
  try {
    child.kill('SIGTERM')
  } catch {
    child.kill()
  }
}

async function inspectStep(page, index) {
  const warnings = await page.evaluate(() => {
    const selectors = [
      '[data-presentation-header]',
      '[data-presentation-footer]',
      '[data-presentation-toc]',
      '[data-presentation-caption]',
      '[data-presentation-title]',
      '[data-scene-node]',
    ]
    const elements = [...document.querySelectorAll(selectors.join(','))]
      .filter((element) => {
        const rect = element.getBoundingClientRect()
        return Boolean(element.textContent?.trim()) && rect.width > 0 && rect.height > 0
      })
      .map((element) => {
        const rect = element.getBoundingClientRect()
        return {
          element,
          label: element.getAttribute('data-scene-entity') ?? element.getAttribute('data-scene-node') ?? (element.className || element.tagName),
          rect: { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom },
          allowed: Boolean(element.closest('[data-presentation-allow-overlap]')),
        }
      })
    const result = []
    for (let first = 0; first < elements.length; first += 1) {
      for (let second = first + 1; second < elements.length; second += 1) {
        if (elements[first].allowed || elements[second].allowed) continue
        if (elements[first].element.contains(elements[second].element) || elements[second].element.contains(elements[first].element)) continue
        if (elements[first].rect.left < elements[second].rect.right && elements[first].rect.right > elements[second].rect.left && elements[first].rect.top < elements[second].rect.bottom && elements[first].rect.bottom > elements[second].rect.top) {
          result.push(`text/chrome overlap: ${elements[first].label} ↔ ${elements[second].label}`)
        }
      }
    }
    const active = [...document.querySelectorAll('[data-presentation-progress-item][aria-current="step"], [data-presentation-toc-item][aria-current="step"]')]
    const inactive = [...document.querySelectorAll('[data-presentation-progress-item]:not([aria-current="step"]), [data-presentation-toc-item]:not([aria-current="step"])')]
    if (active.length && inactive.length) {
      const signature = (element) => {
        const style = getComputedStyle(element)
        return `${style.color}|${style.backgroundColor}|${style.fontWeight}|${style.opacity}|${style.borderColor}`
      }
      if (active.every((element) => signature(element) === signature(inactive[0]))) result.push('active navigation may be visually indistinct')
    }
    const attribution = document.querySelector('[data-presentation-attribution]')
    if (!attribution) result.push('missing [data-presentation-attribution] attribution')
    else {
      const link = attribution.querySelector('a')
      const style = getComputedStyle(attribution)
      if (!link) result.push('attribution is not a link')
      if (!Number.isFinite(Number.parseFloat(style.fontSize)) || Number.parseFloat(style.fontSize) < 10) result.push('attribution is undersized; style [data-presentation-attribution] locally')
      const linkStyle = link ? getComputedStyle(link) : style
      if (link && (!linkStyle.color || linkStyle.color === 'rgb(0, 0, 238)' || linkStyle.textDecorationLine.includes('underline'))) result.push('attribution still looks browser-default; style [data-presentation-attribution] locally')
    }
    return result
  })
  for (const warning of warnings) console.warn(`inspect: advisory step ${index + 1}: ${warning}`)
}

async function main() {
  const port = await availablePort()
  const origin = `http://${host}:${port}`
  const preview = spawn(process.execPath, [resolve('node_modules/vite/bin/vite.js'), 'preview', '--host', host, '--port', String(port), '--strictPort'], {
    stdio: 'ignore',
  })
  let browser
  try {
    await waitFor(`${origin}/`)
    const output = resolve('artifacts/presentation-inspection', slug)
    await mkdir(output, { recursive: true })
    browser = await chromium.launch({ headless: true })
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
    const errors = []
    page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
    page.on('pageerror', (error) => errors.push(error.message))
    await page.goto(`${origin}/${slug}`, { waitUntil: 'networkidle' })
    const chrome = page.locator('[data-step-count][data-step-index]')
    const count = Number(await chrome.getAttribute('data-step-count'))
    if (!Number.isInteger(count) || count < 1) throw new Error(`presentation ${slug} has no inspectable steps`)
    for (let index = 0; index < count; index += 1) {
      if (index > 0) {
        await page.keyboard.press('ArrowRight')
        await page.waitForTimeout(settleMs)
      }
      if (Number(await chrome.getAttribute('data-step-index')) !== index) throw new Error(`step ${index + 1}: transition did not settle`)
      if (errors.length) throw new Error(`step ${index + 1}: ${errors.join('; ')}`)
      await inspectStep(page, index)
      await page.screenshot({ path: resolve(output, `step-${String(index + 1).padStart(2, '0')}.png`), fullPage: true })
    }
    console.log(`inspect: screenshots written to ${output}`)
  } finally {
    await browser?.close()
    stopProcess(preview)
  }
}

try {
  await main()
} catch (error) {
  console.error(`inspect: FAIL ${error instanceof Error ? error.message : String(error)}`)
  process.exitCode = 1
}
