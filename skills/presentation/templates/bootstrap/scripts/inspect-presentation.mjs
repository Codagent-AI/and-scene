#!/usr/bin/env node
import { spawn } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'
import { createRequire } from 'node:module'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { overlapArea, isOverlapAllowed, stylesDistinct, attributionIssues, previewReadinessFailure } from './inspection-diagnostics.mjs'
import { validateRegistration } from './sample-outline.mjs'

// Diagnostic thresholds: flag overlaps above 4px²; attribution below 12px or 44×20px;
// browser default links are rgb(0, 0, 238) with underline. These are advisory only.
const root = path.resolve(process.env.AND_SCENE_ROOT || process.cwd())
const args = process.argv.slice(2)
const slug = args.find((arg) => !arg.startsWith('--'))
const viewportArg = args.find((arg) => arg.startsWith('--viewport='))?.split('=')[1]
const [width, height] = (viewportArg || '1440x900').split('x').map(Number)
const settleArg = args.find((arg) => arg.startsWith('--settle='))?.split('=')[1]
const settle = Number(settleArg ?? process.env.AND_SCENE_SETTLE_MS ?? 1300)
if (!slug) { console.error('Usage: npm run inspect -- <slug> [--viewport=1440x900] [--settle=1300]'); process.exit(2) }
if (!Number.isFinite(width) || !Number.isFinite(height) || width < 320 || height < 240 || !Number.isFinite(settle) || settle < 0) { console.error('Invalid viewport or settle interval'); process.exit(2) }

const require = createRequire(path.join(root, 'package.json'))
const { chromium } = require('playwright')
await validateRegistration(root, slug).catch((error) => { console.error(`[inspect] ${error.message}`); process.exit(1) })
const distIndex = path.join(root, 'dist/index.html')
await new Promise((resolve, reject) => {
  const build = spawn('npm', ['run', 'build'], { cwd: root, stdio: 'inherit' })
  build.once('error', reject); build.once('exit', (code) => code === 0 ? resolve() : reject(new Error(`build exited ${code}`)))
})

const port = await import('node:net').then(({ createServer }) => new Promise((resolve, reject) => {
  const server = createServer(); server.once('error', reject); server.listen(0, '127.0.0.1', () => { const { port: value } = server.address(); server.close(() => resolve(value)) })
}))
const base = `http://127.0.0.1:${port}`
const artifacts = path.join(root, '.inspection', slug)
await mkdir(artifacts, { recursive: true })
let preview
let previewSpawnError
let previewStderr = ''
let lastFetchError = ''
let browser
let interrupt
try {
  preview = spawn(process.execPath, [path.join(root, 'node_modules/vite/bin/vite.js'), 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { cwd: root, stdio: ['ignore', 'ignore', 'pipe'] })
  preview.stderr.setEncoding('utf8')
  preview.stderr.on('data', (chunk) => { previewStderr = (previewStderr + chunk).slice(-6000) })
  preview.on('error', (error) => { previewSpawnError = error })
  interrupt = async () => {
    preview?.kill('SIGTERM')
    await browser?.close().catch(() => {})
    process.exit(130)
  }
  process.once('SIGINT', interrupt)
  process.once('SIGTERM', interrupt)
  let ready = false
  for (let attempt = 0; attempt < 100; attempt++) {
    if (previewSpawnError) throw new Error(`preview failed to start: ${previewSpawnError.message}`)
    if (preview.exitCode !== null) throw new Error(`preview exited before readiness${previewStderr.trim() ? `: ${previewStderr.trim()}` : ''}`)
    try { const response = await fetch(`${base}/`); if (response.ok) { ready = true; lastFetchError = ''; break } lastFetchError = `HTTP ${response.status}` } catch (error) { lastFetchError = error.message }
    await delay(100)
  }
  if (!ready) throw new Error(previewReadinessFailure(lastFetchError, previewStderr))
  browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width, height } })
  await page.goto(`${base}/${slug}`, { waitUntil: 'networkidle' })
  const chrome = page.locator('[data-presentation-chrome]')
  const count = Number(await chrome.getAttribute('data-step-count'))
  if (!Number.isInteger(count) || count < 1) throw new Error('route did not expose a valid step count')
  for (let index = 0; index < count; index++) {
    if (index) {
      await page.keyboard.press('ArrowRight')
      await page.waitForFunction((next) => Number(document.querySelector('[data-presentation-chrome]')?.getAttribute('data-step-index')) === next, index, { timeout: 5000 })
    }
    await delay(settle)
    const diagnostics = await page.evaluate(() => {
      const candidates = [...document.querySelectorAll('[data-presentation-title], [data-presentation-caption], [data-presentation-progress-item], [data-presentation-toc-item], [data-presentation-prev], [data-presentation-next], [data-presentation-node]')]
      const visible = candidates.filter((el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden' && getComputedStyle(el).display !== 'none' && (el.matches('[data-presentation-title], [data-presentation-caption], [data-presentation-progress-item], [data-presentation-toc-item], [data-presentation-prev], [data-presentation-next]') || el.textContent.trim()) && ![...el.children].some((child) => child.matches('[data-presentation-node]')) })
      const label = (el) => el.getAttribute('data-presentation-node') || el.getAttribute('data-presentation-title') || el.getAttribute('data-presentation-caption') || el.getAttribute('aria-label') || el.textContent.trim().slice(0, 40) || el.tagName.toLowerCase()
      const overlaps = []
      for (let i = 0; i < visible.length; i++) for (let j = i + 1; j < visible.length; j++) {
        const a = visible[i], b = visible[j]
        if (a.contains(b) || b.contains(a)) continue
        const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect()
        overlaps.push({ first: label(a), second: label(b), area: { left: ra.left, top: ra.top, right: ra.right, bottom: ra.bottom }, otherArea: { left: rb.left, top: rb.top, right: rb.right, bottom: rb.bottom }, firstAllowed: Boolean(a.closest('[data-presentation-allow-overlap]')), secondAllowed: Boolean(b.closest('[data-presentation-allow-overlap]')) })
      }
      const activeStates = []
      for (const active of document.querySelectorAll('[data-presentation-progress-item][aria-current="step"], [data-presentation-toc-item][aria-current="step"], [data-presentation-active="true"]')) {
        const parent = active.parentElement
        const siblings = [...parent.children].filter((el) => el !== active && (el.hasAttribute('data-presentation-progress-item') || el.hasAttribute('data-presentation-toc-item')))
        const relevant = ['color', 'backgroundColor', 'fontSize', 'fontWeight', 'opacity', 'textDecorationLine', 'borderColor', 'outlineColor']
        const extract = (el) => Object.fromEntries(relevant.map((key) => [key, getComputedStyle(el)[key]]))
        activeStates.push({ label: label(active), style: extract(active), inactive: siblings.map(extract) })
      }
      const attribution = document.querySelector('[data-presentation-attribution]')
      let attributionState
      if (attribution) {
        const r = attribution.getBoundingClientRect(), style = getComputedStyle(attribution)
        attributionState = { style: { fontSize: style.fontSize, color: style.color, textDecorationLine: style.textDecorationLine }, rect: { width: r.width, height: r.height }, link: attribution.tagName === 'A' }
      }
      return { overlaps, activeStates, attributionState }
    })
    const warnings = []
    for (const overlap of diagnostics.overlaps) {
      if (!isOverlapAllowed(overlap.firstAllowed, overlap.secondAllowed) && overlapArea(overlap.area, overlap.otherArea) > 4) warnings.push(`step ${index + 1}: overlap between ${overlap.first} and ${overlap.second}`)
    }
    for (const active of diagnostics.activeStates) {
      if (active.inactive.length && active.inactive.every((style) => !stylesDistinct(active.style, style))) warnings.push(`step ${index + 1}: active chrome ${active.label} is visually indistinct`)
    }
    if (!diagnostics.attributionState) warnings.push(`step ${index + 1}: missing [data-presentation-attribution] styling hook`)
    else for (const issue of attributionIssues(diagnostics.attributionState.style, diagnostics.attributionState.rect, diagnostics.attributionState.link)) warnings.push(`step ${index + 1}: attribution ${issue}; style [data-presentation-attribution]`)
    for (const warning of warnings) console.warn(`[inspect] WARNING ${warning}`)
    await page.screenshot({ path: path.join(artifacts, `step-${String(index + 1).padStart(2, '0')}.png`), fullPage: true })
  }
  console.log(`[inspect] PASS: captured ${count} steps in ${path.relative(root, artifacts)}`)
} catch (error) {
  console.error(`[inspect] FAIL: ${error.message}`)
  process.exitCode = 1
} finally {
  if (interrupt) {
    process.removeListener('SIGINT', interrupt)
    process.removeListener('SIGTERM', interrupt)
  }
  await browser?.close().catch(() => {})
  if (preview && preview.exitCode === null) {
    preview.kill('SIGTERM')
    await Promise.race([new Promise((resolve) => preview.once('exit', resolve)), delay(3000)])
    if (preview.exitCode === null) preview.kill('SIGKILL')
  }
}
