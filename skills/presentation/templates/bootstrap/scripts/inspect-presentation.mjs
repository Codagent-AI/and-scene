import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { access, mkdir, readFile, readdir, rm } from 'node:fs/promises'
import { createServer } from 'node:net'
import { join } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import ts from 'typescript'
import { chromium } from 'playwright'

// Advisory thresholds in CSS pixels. Keep this driver self-contained for bootstrap copies.
const DIAGNOSTICS = { overlapTolerance: 2, minAttributionFont: 11, minOpacity: 0.05, sizeTolerance: 1 }
const SETTLE_MARGIN_MS = 150
let preview, browser, build
let step = 1
async function stop(child) {
  if (!child || child.exitCode !== null || child.signalCode !== null) return
  const exited = once(child, 'exit')
  child.kill('SIGTERM')
  const timer = setTimeout(() => child.kill('SIGKILL'), 3000)
  try { await exited } finally { clearTimeout(timer) }
}
async function cleanup() {
  try { await browser?.close() } finally { await stop(preview); await stop(build) }
}
for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, async () => {
  console.error(`FAIL step ${step}: interrupted by ${signal}`)
  await cleanup()
  process.exit(1)
})

// Runs inside Chromium. Only elements with their own text are candidates; empty
// enclosing diagram containers are not collisions. Ancestor/child pairs are excluded.
function diagnose(thresholds) {
  const root = document.querySelector('[data-step-count][data-step-index]')
  const warnings = []
  const chromeSelector = ['title', 'caption', 'progress-item', 'toc-item', 'prev', 'next', 'attribution']
    .map(name => `[data-presentation-${name}]`).join(',')
  function visibleRect(element, rect = element.getBoundingClientRect()) {
    if (rect.width <= 0 || rect.height <= 0) return null
    let left = Math.max(0, rect.left), top = Math.max(0, rect.top)
    let right = Math.min(innerWidth, rect.right), bottom = Math.min(innerHeight, rect.bottom)
    let opacity = 1
    for (let parent = element; parent; parent = parent.parentElement) {
      const style = getComputedStyle(parent)
      opacity *= Number(style.opacity)
      if (style.display === 'none' || style.visibility !== 'visible' || opacity < thresholds.minOpacity) return null
      if (parent !== element) {
        const box = parent.getBoundingClientRect()
        if (['hidden', 'clip', 'scroll', 'auto'].includes(style.overflowX)) { left = Math.max(left, box.left); right = Math.min(right, box.right) }
        if (['hidden', 'clip', 'scroll', 'auto'].includes(style.overflowY)) { top = Math.max(top, box.top); bottom = Math.min(bottom, box.bottom) }
      }
    }
    return right > left && bottom > top ? { left, right, top, bottom } : null
  }
  function describe(element, text = element.textContent) {
    const hook = element.getAttributeNames().find(name => name.startsWith('data-presentation-') && name !== 'data-presentation-active')
    return `${hook ? `[${hook}]` : element.tagName.toLowerCase()} ${JSON.stringify(text?.trim().replace(/\s+/g, ' ').slice(0, 90))}`
  }
  const candidates = []
  function add(element, rect, text) {
    if (element.closest('[data-presentation-allow-overlap]')) return
    const visible = visibleRect(element, rect)
    if (visible) candidates.push({ element, rect: visible, label: describe(element, text) })
  }
  for (const element of root.querySelectorAll(chromeSelector)) add(element, element.getBoundingClientRect(), element.textContent)
  const textElements = new Set()
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  while (walker.nextNode()) {
    const node = walker.currentNode
    const element = node.parentElement
    if (!node.textContent.trim() || element.closest(`${chromeSelector},script,style,svg`)) continue
    if (textElements.has(element)) continue
    textElements.add(element)
    add(element, element.getBoundingClientRect(), element.textContent)
  }
  const reported = new Set()
  for (let i = 0; i < candidates.length; i++) for (let j = i + 1; j < candidates.length; j++) {
    const a = candidates[i], b = candidates[j]
    if (a.element === b.element || a.element.contains(b.element) || b.element.contains(a.element)) continue
    const width = Math.min(a.rect.right, b.rect.right) - Math.max(a.rect.left, b.rect.left)
    const height = Math.min(a.rect.bottom, b.rect.bottom) - Math.max(a.rect.top, b.rect.top)
    const message = `overlap between ${a.label} and ${b.label}`
    if (width > thresholds.overlapTolerance && height > thresholds.overlapTolerance && !reported.has(message)) {
      warnings.push(message); reported.add(message)
    }
  }
  const visualProperties = ['color', 'backgroundColor', 'backgroundImage', 'borderTopColor', 'borderRightColor', 'borderBottomColor', 'borderLeftColor', 'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth', 'borderTopStyle', 'borderRadius', 'opacity', 'fontWeight', 'fontSize', 'outline', 'outlineOffset', 'boxShadow', 'transform']
  for (const [hook, name] of [['progress-item', 'progress'], ['toc-item', 'ToC']]) {
    const controls = [...root.querySelectorAll(`[data-presentation-${hook}]`)].filter(element => visibleRect(element))
    const active = controls.find(element => element.getAttribute('data-presentation-active') === 'true')
    const inactive = active && controls.find(element => element !== active && element.parentElement === active.parentElement && element.getAttribute('data-presentation-active') !== 'true')
    if (!active || !inactive) continue
    const a = getComputedStyle(active), b = getComputedStyle(inactive)
    const sameSize = ['width', 'height'].every(property => Math.abs(parseFloat(a[property]) - parseFloat(b[property])) <= thresholds.sizeTolerance)
    if (sameSize && visualProperties.every(property => a[property] === b[property])) warnings.push(`indistinct active ${name} [data-presentation-${hook}]`)
  }
  const attribution = root.querySelector('a[data-presentation-attribution][href]')
  if (!attribution) warnings.push('attribution missing link; style [data-presentation-attribution]')
  else {
    const style = getComputedStyle(attribution)
    const rect = attribution.getBoundingClientRect(), visible = visibleRect(attribution)
    const reasons = []
    if (!visible || visible.right - visible.left < rect.width - thresholds.overlapTolerance || visible.bottom - visible.top < rect.height - thresholds.overlapTolerance) reasons.push('clipped/invisible')
    if (parseFloat(style.fontSize) < thresholds.minAttributionFont) reasons.push(`too small (${style.fontSize})`)
    if (['rgb(0, 0, 238)', 'rgb(85, 26, 139)'].includes(style.color) && style.textDecorationLine.includes('underline')) reasons.push('browser-default link styling')
    if (reasons.length) warnings.push(`attribution ${reasons.join(', ')}; style [data-presentation-attribution]`)
  }
  return warnings
}

try {
  // Compile the kit's actual constants instead of duplicating its animation timings.
  const source = await readFile('src/presentation-kit/constants.ts', 'utf8')
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText
  const timing = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`)
  const defaultSettle = Math.ceil(Math.max(timing.LAYOUT_T, timing.ENTER_DELAY + timing.ENTER_T) * 1000) + SETTLE_MARGIN_MS
  if (!Number.isFinite(defaultSettle)) throw new Error('Invalid kit animation constants')
  const args = process.argv.slice(2)
  let slug, settle = defaultSettle, viewport = { width: 1440, height: 900 }, forceBuild = false
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (arg === '--build') forceBuild = true
    else if (arg === '--settle') {
      const value = args[++i]
      if (!value || !/^\d+$/.test(value)) throw new Error('--settle requires nonnegative milliseconds')
      settle = Number(value)
      if (!Number.isSafeInteger(settle) || settle > 2147483647) throw new Error('Invalid --settle interval')
    } else if (arg === '--viewport') {
      const match = /^(\d+)x(\d+)$/.exec(args[++i] ?? '')
      if (!match || match.slice(1).some(value => Number(value) < 1 || Number(value) > 16384)) throw new Error('--viewport requires WxH (1–16384 pixels)')
      viewport = { width: Number(match[1]), height: Number(match[2]) }
    } else if (!slug && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(arg)) slug = arg
    else throw new Error(`Unknown argument: ${arg}`)
  }
  if (!slug) throw new Error('Usage: npm run inspect -- <slug> [--settle ms] [--viewport WxH] [--build]')
  let distExists = true
  try { await access('dist/index.html') } catch { distExists = false }
  if (forceBuild || !distExists) {
    build = spawn(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'build'], { stdio: 'inherit', env: { ...process.env, NODE_ENV: 'production' } })
    const [code] = await once(build, 'exit')
    if (code !== 0) throw new Error(`npm run build exited ${code}`)
  }
  const server = createServer()
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve) })
  const port = server.address().port
  await new Promise(resolve => server.close(resolve))
  const origin = `http://127.0.0.1:${port}`
  let previewOutput = ''
  preview = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, NODE_ENV: 'production' } })
  preview.stdout.on('data', data => { previewOutput += data })
  preview.stderr.on('data', data => { previewOutput += data })
  let ready = false
  for (let attempt = 0; attempt < 100; attempt++) {
    if (preview.exitCode !== null) throw new Error(`Preview exited: ${previewOutput}`)
    try { ready = (await fetch(origin, { signal: AbortSignal.timeout(500) })).ok } catch { /* not ready yet */ }
    if (ready) break
    await delay(150)
  }
  if (!ready) throw new Error(`Preview did not become ready: ${previewOutput}`)
  console.log(`Inspect ${origin}/${slug} viewport=${viewport.width}x${viewport.height} settle=${settle}ms`)
  browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport })
  page.setDefaultTimeout(5000)
  const errors = []
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
  page.on('pageerror', error => errors.push(error.message))
  page.on('crash', () => errors.push('Browser page crashed'))
  const checkErrors = () => { if (errors.length) throw new Error(errors.join('\n')) }
  // Confirm the slug is publicly registered, rather than inspecting a fallback route.
  await page.goto(origin)
  const registered = await page.locator('[data-presentation-link]').evaluateAll(links => links.map(link => new URL(link.getAttribute('href'), location.href).pathname))
  if (!registered.includes(`/${slug}`)) throw new Error(`Unreachable registered route: ${slug}`)
  await page.goto(`${origin}/${slug}`)
  const chrome = page.locator('[data-step-count][data-step-index]')
  await chrome.waitFor()
  if (await chrome.getAttribute('data-presentation-mode') === 'present') await page.keyboard.press('p')
  const countValue = await chrome.getAttribute('data-step-count')
  const count = Number(countValue)
  if (!countValue || !Number.isSafeInteger(count) || count < 1) throw new Error(`Invalid step-count hook: ${countValue}`)
  const directory = join('.inspection', slug)
  await mkdir(directory, { recursive: true })
  // Remove stale step images after a deck shrinks, keeping unrelated artifacts intact.
  for (const file of await readdir(directory)) if (/^step-\d+\.png$/.test(file)) await rm(join(directory, file))
  for (step = 1; step <= count; step++) {
    if (step > 1) await page.keyboard.press('ArrowRight')
    await page.waitForFunction(expected => document.querySelector('[data-step-count][data-step-index]')?.getAttribute('data-step-index') === String(expected), step - 1)
    await page.waitForTimeout(settle)
    await page.evaluate(() => document.fonts.ready)
    checkErrors()
    if (await chrome.getAttribute('data-step-index') !== String(step - 1)) throw new Error('Step-index changed while settling')
    for (const warning of await page.evaluate(diagnose, DIAGNOSTICS)) console.log(`WARN step ${step}: ${warning}`)
    const file = join(directory, `step-${String(step).padStart(2, '0')}.png`)
    await page.screenshot({ path: file, animations: 'allow' })
    checkErrors()
    console.log(`Captured step ${step}: ${file}`)
  }
  console.log(`PASS captured ${count} settled steps; visual warnings are advisory`)
} catch (error) {
  console.error(`FAIL step ${step}: ${error.message}`)
  process.exitCode = 1
} finally { await cleanup() }
