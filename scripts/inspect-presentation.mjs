import { spawn } from 'node:child_process'
import { mkdir } from 'node:fs/promises'
import { createServer } from 'node:net'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { attributionWarning, overlapWarnings, stylesAreIndistinct } from './inspection-diagnostics.mjs'

const host = '127.0.0.1'
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const slug = process.argv[2]
if (!slug) throw new Error('Usage: npm run inspect -- <presentation-slug>')

function run(command, args) {
  return new Promise((resolveRun, reject) => {
    const child = spawn(command, args, { cwd: root, stdio: 'inherit', shell: process.platform === 'win32' })
    child.once('error', reject)
    child.once('exit', (code) => code === 0 ? resolveRun() : reject(new Error(`${command} ${args.join(' ')} exited ${code}`)))
  })
}

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
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try { if ((await fetch(url)).ok) return } catch { /* preview is starting */ }
    await new Promise((resolveWait) => setTimeout(resolveWait, 100))
  }
  throw new Error(`preview did not become ready at ${url}`)
}

async function pageDiagnostics(page, step) {
  const candidates = await page.evaluate(() => [...document.querySelectorAll('[data-presentation-entity], [data-presentation-caption], [data-presentation-title], [data-presentation-marker], [data-presentation-progress-item], [data-presentation-toc-item], [data-presentation-controls], [data-presentation-attribution]')]
    .filter((element) => {
      const style = getComputedStyle(element)
      const rect = element.getBoundingClientRect()
      return style.visibility !== 'hidden' && style.display !== 'none' && Number(style.opacity) > 0 && rect.width > 0 && rect.height > 0
    })
    .map((element) => {
      const rect = element.getBoundingClientRect()
      return {
        label: element.getAttribute('aria-label') || element.getAttribute('data-presentation-entity') || element.tagName.toLowerCase(),
        allowed: Boolean(element.closest('[data-presentation-allow-overlap]')),
        rect: { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom },
      }
    }))
  for (const warning of overlapWarnings(candidates, step)) console.warn(warning)

  const chrome = await page.evaluate(() => {
    const active = document.querySelector('[data-presentation-progress-item][data-presentation-active], [data-presentation-toc-item][data-presentation-active]')
    const inactive = document.querySelector('[data-presentation-progress-item]:not([data-presentation-active]), [data-presentation-toc-item]:not([data-presentation-active])')
    const styles = (element) => element ? (() => { const style = getComputedStyle(element); return { color: style.color, backgroundColor: style.backgroundColor, borderColor: style.borderColor } })() : null
    const attribution = document.querySelector('[data-presentation-attribution]')
    const attributionStyle = attribution ? getComputedStyle(attribution) : null
    return { active: styles(active), inactive: styles(inactive), attribution: attributionStyle ? { fontSize: Number.parseFloat(attributionStyle.fontSize), color: attributionStyle.color } : null }
  })
  if (chrome.active && chrome.inactive && stylesAreIndistinct(chrome.active, chrome.inactive)) {
    console.warn(`inspect: advisory step ${step}: active chrome may be indistinct; style [data-presentation-active] locally`)
  }
  const attribution = attributionWarning(chrome.attribution)
  if (attribution) console.warn(attribution)
}

async function main() {
  await run('npm', ['run', 'build'])
  const port = await availablePort()
  const origin = `http://${host}:${port}`
  const preview = spawn('npm', ['run', 'preview', '--', '--host', host, '--port', String(port), '--strictPort'], { cwd: root, stdio: 'inherit', shell: process.platform === 'win32' })
  let browser
  try {
    await waitFor(origin)
    const output = resolve(root, 'artifacts/presentation-inspection', slug)
    await mkdir(output, { recursive: true })
    browser = await chromium.launch({ headless: true })
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
    await page.goto(`${origin}/${slug}`, { waitUntil: 'networkidle' })
    const chrome = page.locator('[data-presentation-chrome]')
    await chrome.waitFor()
    const count = Number(await chrome.getAttribute('data-step-count'))
    if (!Number.isInteger(count) || count < 1) throw new Error(`presentation ${slug} has no inspectable steps`)
    for (let index = 0; index < count; index += 1) {
      await page.locator(`[data-presentation-progress-item][aria-label="Go to step ${index + 1}"]`).click()
      await page.waitForTimeout(700)
      await page.screenshot({ path: resolve(output, `step-${String(index + 1).padStart(2, '0')}.png`), fullPage: true })
      await pageDiagnostics(page, index + 1)
    }
    await page.close()
    console.log(`inspect: screenshots written to ${output}`)
  } finally {
    await browser?.close()
    preview.kill()
  }
}

main().catch((error) => {
  console.error(`inspect: FAIL ${error instanceof Error ? error.message : error}`)
  process.exitCode = 1
})
