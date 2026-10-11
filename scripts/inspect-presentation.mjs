#!/usr/bin/env node
/** Builds first, serves the production output, then captures settled screenshots. */
import { spawn } from 'node:child_process'
import { createServer } from 'node:net'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { setTimeout as delay } from 'node:timers/promises'
import { chromium } from 'playwright'

const args = process.argv.slice(2)
const parseViewport = value => { const match = /^(\d+)x(\d+)$/.exec(value); if (!match) throw Error(`invalid viewport "${value}"; expected WIDTHxHEIGHT`); return { width: Number(match[1]), height: Number(match[2]) } }
const usage = 'usage: npm run inspect -- <slug> [--settle-ms 500] [--viewport 1280x800] [--narrow [390x844]] [--root <project-root>]; builds first, then serves Vite production preview'
function parseArgs(values) {
  const options = new Map()
  let slug
  for (let index = 0; index < values.length; index++) {
    const value = values[index]
    if (value === '--help') throw Error(usage)
    if (value === '--narrow') {
      const maybeViewport = values[index + 1]
      if (maybeViewport && !maybeViewport.startsWith('--') && /^\d+x\d+$/.test(maybeViewport)) {
        options.set(value, maybeViewport)
        index++
      } else options.set(value, true)
      continue
    }
    if (['--root', '--settle-ms', '--viewport'].includes(value)) {
      const optionValue = values[index + 1]
      if (!optionValue || optionValue.startsWith('--')) throw Error(`${value} requires a value; ${usage}`)
      options.set(value, optionValue)
      index++
      continue
    }
    if (value.startsWith('--')) throw Error(`unknown option "${value}"; ${usage}`)
    if (slug === undefined) slug = value
    else throw Error(`unexpected argument "${value}"; ${usage}`)
  }
  if (!slug || !/^[a-z0-9][a-z0-9-]*$/.test(slug)) throw Error(`invalid slug "${slug ?? ''}"; expected /^[a-z0-9][a-z0-9-]*$/; ${usage}`)
  const settle = Number(options.get('--settle-ms') ?? 500)
  if (!Number.isFinite(settle) || settle < 0) throw Error(`invalid --settle-ms value; ${usage}`)
  const viewportArg = options.get('--viewport') ?? '1280x800'
  const viewports = [parseViewport(viewportArg)]
  if (options.has('--narrow')) viewports.push(parseViewport(options.get('--narrow') === true ? '390x844' : options.get('--narrow')))
  return { slug, settle, root: path.resolve(options.get('--root') || process.env.AND_SCENE_ROOT || process.cwd()), viewports }
}
let parsed
try { parsed = parseArgs(args) } catch (error) { console.error(`FAIL: inspect: ${error.message}`); process.exit(1) }
const { slug, settle, root, viewports } = parsed
let preview
let previewError
let browser
function run(command, commandArgs) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, commandArgs, { cwd: root, stdio: 'inherit', shell: process.platform === 'win32' })
    child.once('error', reject)
    child.once('exit', code => code === 0 ? resolve() : reject(Error(`${command} exited ${code}`)))
  })
}
async function freePort() {
  const server = createServer()
  await new Promise((resolve, reject) => server.once('error', reject).listen(0, '127.0.0.1', resolve))
  const port = server.address().port
  await new Promise(resolve => server.close(resolve))
  return port
}
async function waitReady(url) {
  for (let i = 0; i < 100; i++) {
    if (previewError) throw Error(`preview failed to start: ${previewError.message}`)
    if (preview.exitCode !== null || preview.signalCode !== null) throw Error(`preview exited early (${preview.exitCode ?? preview.signalCode})`)
    try { if ((await fetch(url)).ok) return } catch {}
    await delay(100)
  }
  throw Error(`preview did not become ready at ${url}`)
}
async function diagnostics(page, step) {
  const warnings = await page.evaluate(() => {
    const visible = element => { const style = getComputedStyle(element); const rect = element.getBoundingClientRect(); return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) > 0 && rect.width > 0 && rect.height > 0 }
    const allow = element => Boolean(element.closest('[data-presentation-allow-overlap]'))
    const candidates = [...document.querySelectorAll('main *')].filter(el => visible(el) && !allow(el) && !el.matches('[data-presentation-progress], [data-presentation-toc], [data-presentation-footer], [data-presentation-stage], [data-presentation-canvas], [data-presentation-scene]') && (el.matches('[data-presentation-title], [data-presentation-caption], [data-presentation-attribution], [data-presentation-label], [data-presentation-box], [data-presentation-symbol-chip], [data-presentation-progress] button, [data-presentation-toc] button') || el.children.length === 0 && el.textContent.trim()))
    const overlaps = []
    const label = el => el.getAttribute('data-presentation-label') || el.getAttribute('data-presentation-box') || el.getAttribute('aria-label') || el.textContent.trim().replace(/\s+/g, ' ').slice(0, 70) || el.tagName.toLowerCase()
    for (let i = 0; i < candidates.length; i++) for (let j = i + 1; j < candidates.length; j++) {
      const a = candidates[i], b = candidates[j]
      if (a.contains(b) || b.contains(a)) continue
      const x = a.getBoundingClientRect(), y = b.getBoundingClientRect()
      const iw = Math.min(x.right, y.right) - Math.max(x.left, y.left), ih = Math.min(x.bottom, y.bottom) - Math.max(x.top, y.top)
      if (iw > 2 && ih > 2) overlaps.push(`${label(a)} ↔ ${label(b)}`)
    }
    const activeWarnings = []
    for (const selector of ['[data-presentation-progress]', '[data-presentation-toc]']) {
      const nav = document.querySelector(selector)
      if (!nav || !visible(nav)) continue
      const active = nav.querySelector('[data-presentation-active], [aria-current="step"]')
      const inactive = [...nav.querySelectorAll('button')].find(el => el !== active && visible(el))
      if (!active || !inactive) continue
      const a = getComputedStyle(active), b = getComputedStyle(inactive)
      const signature = s => [s.color, s.backgroundColor, s.borderColor, s.fontWeight, s.textDecorationLine, s.boxShadow].join('|')
      if (signature(a) === signature(b)) activeWarnings.push(selector.includes('progress') ? 'active progress indicator' : 'active table-of-contents entry')
    }
    const attribution = document.querySelector('[data-presentation-attribution]')
    let attributionWarning = ''
    if (!attribution || visible(attribution)) {
      if (!attribution) attributionWarning = 'attribution link is missing; style the [data-presentation-attribution] hook'
      else {
        const style = getComputedStyle(attribution)
        if (parseFloat(style.fontSize) < 11 || style.color === 'rgb(0, 0, 238)' || style.textDecorationLine.includes('underline')) attributionWarning = 'attribution link is tiny or browser-default; style the [data-presentation-attribution] hook'
      }
    }
    return { overlaps, activeWarnings, attributionWarning }
  })
  for (const pair of warnings.overlaps) console.warn(`WARN step ${step}: visible overlap: ${pair}`)
  for (const item of warnings.activeWarnings) console.warn(`WARN step ${step}: ${item} is visually indistinguishable from inactive controls`)
  if (warnings.attributionWarning) console.warn(`WARN step ${step}: ${warnings.attributionWarning}`)
}
async function settleMotion(page) {
  await page.evaluate(async () => { await Promise.all(document.getAnimations({ subtree: true }).map(animation => animation.finished.catch(() => {}))) })
  await page.waitForTimeout(settle)
  let previous = ''
  for (let i = 0; i < 8; i++) {
    const current = await page.locator('[data-presentation-stage]').evaluate(el => { const r = el.getBoundingClientRect(); return `${r.x}:${r.y}:${r.width}:${r.height}:${el.innerHTML}` })
    if (current === previous) break
    previous = current
    await page.waitForTimeout(80)
  }
}
let cleanupPromise
async function cleanup() {
  if (cleanupPromise) return cleanupPromise
  cleanupPromise = (async () => {
    if (preview && preview.exitCode === null && preview.signalCode === null) {
      const exited = new Promise(resolve => preview.once('exit', resolve))
      preview.kill('SIGTERM')
      const stopped = await Promise.race([exited.then(() => true), delay(1500).then(() => false)])
      if (!stopped) {
        preview.kill('SIGKILL')
        await Promise.race([exited, delay(1000)])
      }
    }
    await browser?.close().catch(() => {})
  })()
  return cleanupPromise
}
async function main() {
  await run(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'build'])
  const port = await freePort()
  const viteCli = path.join(root, 'node_modules', 'vite', 'bin', 'vite.js')
  preview = spawn(process.execPath, [viteCli, 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { cwd: root, stdio: 'inherit' })
  preview.once('error', error => { previewError = error })
  const base = `http://127.0.0.1:${port}`
  await waitReady(base)
  try { browser = await chromium.launch() } catch (error) { throw Error(`Chromium unavailable; install it with "npx playwright install chromium" (${error.message})`) }
  for (const viewport of viewports) {
    const page = await browser.newPage({ viewport })
    await page.goto(`${base}/${slug}`, { waitUntil: 'networkidle' })
    const chrome = page.locator('[data-presentation-step-count]')
    await chrome.waitFor()
    const count = Number(await chrome.getAttribute('data-presentation-step-count'))
    if (!Number.isInteger(count) || count < 1) throw Error('presentation has no readable step count')
    const directory = path.join(root, '.and-scene/inspection', slug, `${viewport.width}x${viewport.height}`)
    await mkdir(directory, { recursive: true })
    for (let step = 1; step <= count; step++) {
      if (step > 1) {
        await page.keyboard.press('ArrowRight')
        await page.waitForFunction(expected => Number(document.querySelector('[data-presentation-step-index]')?.getAttribute('data-presentation-step-index')) === expected, step - 1)
      }
      await settleMotion(page)
      await diagnostics(page, step)
      const filename = `step-${String(step).padStart(2, '0')}.png`
      await page.screenshot({ path: path.join(directory, filename), fullPage: true })
      console.log(`Captured ${path.relative(root, path.join(directory, filename))}`)
    }
    await page.close()
  }
}
for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP']) process.once(signal, () => { cleanup().finally(() => process.exit(128 + (signal === 'SIGINT' ? 2 : signal === 'SIGTERM' ? 15 : 1))) })
try { await main() } catch (error) { console.error(`FAIL: inspect: ${error.message}`); process.exitCode = 1 } finally { await cleanup() }
