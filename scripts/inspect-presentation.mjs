import { spawn } from 'node:child_process'
import { createRequire } from 'node:module'
import { setTimeout as delay } from 'node:timers/promises'
import path from 'node:path'
import fs from 'node:fs/promises'
import net from 'node:net'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const args = process.argv.slice(2)
const slug = args.find((arg) => !arg.startsWith('-'))
if (!slug) { console.error('Usage: npm run inspect -- <slug> [--narrow] [--settle=1200]'); process.exit(2) }
const narrow = args.includes('--narrow')
const settleArg = args.find((arg) => arg.startsWith('--settle='))?.split('=')[1]
const settle = Math.max(0, Number(settleArg ?? process.env.AND_SCENE_SETTLE_MS ?? 1200) || 0)
const width = narrow ? 390 : 1440
const height = narrow ? 844 : 900
const require = createRequire(path.join(root, 'package.json'))
const { chromium } = require('playwright')
let preview
let browser
let previewError

async function port() {
  return await new Promise((resolve, reject) => {
    const server = net.createServer()
    server.once('error', reject)
    server.listen(0, '127.0.0.1', () => { const selected = server.address().port; server.close(() => resolve(selected)) })
  })
}
async function ready(url) {
  const deadline = Date.now() + 30000
  while (Date.now() < deadline) {
    if (previewError) throw new Error(`preview could not start: ${previewError.message}`)
    try { if ((await fetch(url)).ok) return } catch {}
    await delay(200)
  }
  throw new Error(`preview did not become ready at ${url}`)
}
async function cleanup() {
  await browser?.close().catch(() => {})
  if (preview && preview.exitCode === null) {
    preview.kill('SIGTERM')
    await Promise.race([new Promise((resolve) => preview.once('exit', resolve)), delay(3000)])
    if (preview.exitCode === null) preview.kill('SIGKILL')
  }
}
for (const [signal, code] of [['SIGINT', 130], ['SIGTERM', 143]]) {
  process.once(signal, async () => { await cleanup(); process.exit(code) })
}

try {
  await new Promise((resolve, reject) => {
    const npm = spawn(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'build'], { cwd: root, stdio: 'inherit' })
    npm.once('error', reject)
    npm.once('exit', (code) => code === 0 ? resolve() : reject(new Error(`build failed with exit ${code}`)))
  })
  const selectedPort = await port()
  const vite = path.resolve(path.dirname(require.resolve('vite')), '../../bin/vite.js')
  preview = spawn(process.execPath, [vite, 'preview', '--host', '127.0.0.1', '--port', String(selectedPort), '--strictPort'], { cwd: root, stdio: 'inherit' })
  preview.once('error', (error) => { previewError = error })
  const base = `http://127.0.0.1:${selectedPort}`
  await ready(base)
  browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width, height } })
  await page.goto(`${base}/${encodeURIComponent(slug)}`, { waitUntil: 'networkidle' })
  const chrome = page.locator('[data-step-count][data-step-index]').first()
  await chrome.waitFor({ timeout: 10000 })
  const count = Number(await chrome.getAttribute('data-step-count'))
  if (!Number.isInteger(count) || count < 1) throw new Error(`invalid step count for '${slug}'`)
  const output = path.join(root, '.and-scene', 'screenshots', slug)
  await fs.mkdir(output, { recursive: true })
  for (let index = 0; index < count; index++) {
    if (index > 0) {
      await page.keyboard.press('ArrowRight')
      await page.waitForFunction((expected) => Number(document.querySelector('[data-step-index]')?.getAttribute('data-step-index')) === expected, index, { timeout: 3000 })
    }
    await page.waitForTimeout(settle)
    const warnings = await page.evaluate(() => {
      const warnings = []
      const visible = (element) => {
        const style = getComputedStyle(element)
        const rect = element.getBoundingClientRect()
        return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) > 0 && rect.width > 0 && rect.height > 0
      }
      const excluded = (element) => element.closest('[data-presentation-allow-overlap]') !== null
      const textNodes = [...document.querySelectorAll('body *')].filter((el) => visible(el) && !excluded(el) && el.children.length === 0 && el.textContent.trim())
      const rectOf = (element) => element.getBoundingClientRect()
      const label = (element) => `${element.tagName.toLowerCase()}${element.getAttribute('data-presentation-title') !== null ? '[title]' : ''}: “${element.textContent.trim().replace(/\s+/g, ' ').slice(0, 48)}”`
      const overlaps = (a, b) => { const x = rectOf(a), y = rectOf(b); return x.left < y.right && x.right > y.left && x.top < y.bottom && x.bottom > y.top }
      for (let i = 0; i < textNodes.length; i++) for (let j = i + 1; j < textNodes.length; j++) {
        if (textNodes[i].contains(textNodes[j]) || textNodes[j].contains(textNodes[i])) continue
        if (overlaps(textNodes[i], textNodes[j])) warnings.push(`overlap between ${label(textNodes[i])} and ${label(textNodes[j])}`)
      }
      const controls = [...document.querySelectorAll('[data-presentation-progress-item], [data-presentation-toc-item]')].filter(visible)
      const active = controls.find((element) => element.getAttribute('aria-current') === 'step' || element.getAttribute('data-presentation-active') === 'true')
      if (active) {
        const activeStyle = getComputedStyle(active)
        const signature = (style) => [style.color, style.backgroundColor, style.borderColor, style.borderWidth, style.fontWeight, style.opacity, style.boxShadow].join('|')
        const peers = controls.filter((element) => element !== active)
        if (peers.length && peers.some((element) => signature(getComputedStyle(element)) === signature(activeStyle))) warnings.push('active progress or table-of-contents state is visually indistinguishable from an inactive control')
      }
      const attribution = document.querySelector('[data-presentation-attribution]')
      if (!attribution || visible(attribution) && (parseFloat(getComputedStyle(attribution).fontSize) < 12 || ['rgb(0, 0, 238)', 'rgb(85, 26, 139)'].includes(getComputedStyle(attribution).color))) warnings.push('attribution is missing, too small, or browser-default; style it with [data-presentation-attribution]')
      return warnings
    })
    const step = index + 1
    for (const warning of warnings) console.warn(`WARN inspect step ${step}: ${warning}`)
    const filename = path.join(output, `step-${String(step).padStart(2, '0')}.png`)
    await page.screenshot({ path: filename, fullPage: true, animations: 'disabled' })
    console.log(`Captured step ${step}/${count}: ${path.relative(root, filename)}`)
  }
  console.log(`PASS inspect: captured ${count} steps at ${width}x${height}; settle ${settle}ms`)
} catch (error) {
  console.error(`FAIL inspect: ${error.message}`)
  process.exitCode = 1
} finally {
  await cleanup()
}
