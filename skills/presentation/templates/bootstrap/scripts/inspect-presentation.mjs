// `npm run inspect -- <slug> [--viewport 1440x900] [--settle 1000] [--out .inspection] [--skip-build]`
// Captures one settled screenshot per step from a production preview on
// 127.0.0.1 and prints advisory visual warnings. Warnings never change the exit
// code; a build, navigation, or capture failure exits non-zero.
import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { ensureChromium, launchOptions, loopbackUrl, runCommand, startPreview, stopPreview } from './lib/preview.mjs'

export const DEFAULTS = { viewport: { width: 1440, height: 900 }, settleMs: 1000, outDir: '.inspection', stepTimeoutMs: 5000 }
export const MIN_ATTRIBUTION_PX = 12
const ACTIVE_STYLE_KEYS = ['color', 'backgroundColor', 'borderColor', 'outline', 'fontWeight', 'opacity', 'width', 'height', 'boxShadow']
const ATTRIBUTION_DEFAULT_KEYS = ['color', 'fontSize', 'fontFamily', 'textDecorationLine', 'padding', 'fontWeight']

export function parseViewport(text) {
  const m = /^(\d+)x(\d+)$/.exec(text ?? '')
  if (!m) throw new Error(`invalid --viewport "${text}"; expected WIDTHxHEIGHT`)
  return { width: Number(m[1]), height: Number(m[2]) }
}

export function screenshotName(step) {
  return `step-${String(step + 1).padStart(2, '0')}.png`
}

/** Sleep until `settleMs` have elapsed since `startedAt`, using injected clock functions. */
export async function waitUntilSettled({ now, sleep }, startedAt, settleMs) {
  for (let remaining = startedAt + settleMs - now(); remaining > 0; remaining = startedAt + settleMs - now()) {
    await sleep(remaining)
  }
}

/** Area (px²) of the intersection of two rects; 0 when they only touch or are apart. */
export function intersectionArea(a, b) {
  const w = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x)
  const h = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y)
  return w > 0 && h > 0 ? w * h : 0
}

/** Items are `{ label, rect, visible, allowed }`; allowed items sit inside an allow-overlap subtree. */
export function findOverlaps(items, minArea = 4) {
  const live = items.filter((i) => i.visible && i.rect.width > 0 && i.rect.height > 0)
  const found = []
  for (let i = 0; i < live.length; i++) {
    for (let j = i + 1; j < live.length; j++) {
      if (live[i].allowed || live[j].allowed) continue
      if (intersectionArea(live[i].rect, live[j].rect) >= minArea) found.push([live[i].label, live[j].label])
    }
  }
  return found
}

/** True when the active item's computed style differs from every inactive sibling in some tracked property. */
export function activeIsDistinct(active, inactive) {
  return inactive.every((other) => ACTIVE_STYLE_KEYS.some((k) => active[k] !== other[k]))
}

/** Describe why an attribution link looks unpolished; empty when it is legible and styled. */
export function attributionIssues(style, browserDefault) {
  if (!style) return ['is missing']
  const issues = []
  if (parseFloat(style.fontSize) < MIN_ATTRIBUTION_PX) issues.push(`is undersized (${style.fontSize}, minimum ${MIN_ATTRIBUTION_PX}px)`)
  if (ATTRIBUTION_DEFAULT_KEYS.every((k) => style[k] === browserDefault[k])) issues.push('uses browser-default link styling')
  return issues
}

/** Runs in the page: gathers visible text/chrome boxes, active-chrome styles, and attribution style. */
function collectPage({ activeKeys, defaultKeys }) {
  const describe = (el) => {
    const owner = el.closest('[data-presentation-id]') ?? el
    const hook = [...owner.attributes].find((a) => a.name.startsWith('data-presentation-') && a.name !== 'data-presentation-active')
    const id = owner.getAttribute('data-presentation-id')
    const text = (el.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 32)
    return `<${owner.tagName.toLowerCase()}${id ? ` id=${id}` : hook ? ` ${hook.name}` : ''}>${text ? ` "${text}"` : ''}`
  }
  const visible = (el) => el.checkVisibility({ opacityProperty: true, visibilityProperty: true })
  const items = []
  const root = document.querySelector('[data-presentation-root]') ?? document.body
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT)
  for (let el = walker.currentNode; el; el = walker.nextNode()) {
    if (!(el instanceof HTMLElement || el instanceof SVGElement)) continue
    const own = [...el.childNodes].filter((n) => n.nodeType === Node.TEXT_NODE && n.textContent.trim())
    const isChromeBox = el.matches('[data-presentation-progress-dot]')
    if (own.length === 0 && !isChromeBox) continue
    let rect
    if (isChromeBox) rect = el.getBoundingClientRect()
    else {
      const range = document.createRange()
      range.setStartBefore(own[0])
      range.setEndAfter(own[own.length - 1])
      rect = range.getBoundingClientRect()
    }
    items.push({
      label: describe(el),
      rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
      visible: visible(el),
      allowed: el.closest('[data-presentation-allow-overlap]') !== null,
    })
  }
  const styleOf = (el, keys) => {
    const cs = getComputedStyle(el)
    return Object.fromEntries(keys.map((k) => [k, cs[k]]))
  }
  const chrome = (selector, name) => {
    const all = [...document.querySelectorAll(selector)].filter(visible)
    const active = all.filter((e) => e.getAttribute('data-presentation-active') === 'true')
    const inactive = all.filter((e) => e.getAttribute('data-presentation-active') !== 'true')
    return active.length && inactive.length
      ? { name, active: styleOf(active[0], activeKeys), inactive: inactive.map((e) => styleOf(e, activeKeys)) }
      : null
  }
  const attr = document.querySelector('[data-presentation-attribution]')
  const probe = document.createElement('a')
  probe.href = '#'
  probe.textContent = 'probe'
  document.body.append(probe)
  const browserDefault = styleOf(probe, defaultKeys)
  probe.remove()
  return {
    items,
    chrome: [chrome('[data-presentation-progress-dot]', 'progress indicator'), chrome('[data-presentation-toc-entry]', 'table-of-contents entry')].filter(Boolean),
    attribution: attr && visible(attr) ? styleOf(attr, defaultKeys) : null,
    browserDefault,
  }
}

/** Advisory warnings for one step's collected page data. */
export function diagnose(step, data) {
  const warnings = []
  for (const [a, b] of findOverlaps(data.items)) {
    warnings.push(`step ${step + 1}: overlap between ${a} and ${b}; fix it or mark an intentional readable overlap with data-presentation-allow-overlap`)
  }
  for (const c of data.chrome) {
    if (!activeIsDistinct(c.active, c.inactive)) {
      warnings.push(`step ${step + 1}: active ${c.name} looks identical to inactive ones; style [data-presentation-active="true"]`)
    }
  }
  for (const issue of attributionIssues(data.attribution, data.browserDefault)) {
    warnings.push(`step ${step + 1}: attribution ${issue}; style [data-presentation-attribution]`)
  }
  return warnings
}

export function parseArgs(argv) {
  const opts = { ...DEFAULTS, skipBuild: false, slug: null }
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--viewport') opts.viewport = parseViewport(argv[++i])
    else if (arg === '--settle') opts.settleMs = Number(argv[++i])
    else if (arg === '--out') opts.outDir = argv[++i]
    else if (arg === '--skip-build') opts.skipBuild = true
    else if (arg.startsWith('--')) throw new Error(`unknown option ${arg}`)
    else opts.slug = arg
  }
  if (!opts.slug) throw new Error('usage: npm run inspect -- <slug> [--viewport WxH] [--settle ms] [--out dir] [--skip-build]')
  if (!Number.isFinite(opts.settleMs) || opts.settleMs < 0) throw new Error('--settle must be a non-negative number of milliseconds')
  return opts
}

async function runBuild(root) {
  const { code, output } = await runCommand('npm', ['run', 'build'], root)
  if (code !== 0) throw new Error('npm run build failed:\n' + output)
}

export async function inspect(opts, root = process.cwd(), log = console.log) {
  if (!opts.skipBuild) await runBuild(root)
  const outDir = path.resolve(root, opts.outDir, opts.slug)
  mkdirSync(outDir, { recursive: true })
  const chromium = await ensureChromium(root, log)
  const preview = await startPreview(root, { log })
  const clock = { now: () => Date.now(), sleep: (ms) => new Promise((r) => setTimeout(r, ms)) }
  let browser
  const warnings = []
  let shots = 0
  try {
    browser = await chromium.launch(launchOptions())
    const page = await browser.newPage({ viewport: opts.viewport })
    await page.goto(loopbackUrl(preview.port, `/${opts.slug}`), { waitUntil: 'load' })
    await page.waitForSelector('[data-step-index]', { timeout: DEFAULTS.stepTimeoutMs }).catch(() => {
      throw new Error(`"${opts.slug}" did not render a presentation at ${loopbackUrl(preview.port, '/' + opts.slug)}`)
    })
    const count = Number(await page.getAttribute('[data-step-index]', 'data-step-count'))
    for (let step = 0; step < count; step++) {
      const startedAt = clock.now()
      await waitUntilSettled(clock, startedAt, opts.settleMs)
      const file = path.join(outDir, screenshotName(step))
      await page.screenshot({ path: file })
      shots++
      const data = await page.evaluate(collectPage, { activeKeys: ACTIVE_STYLE_KEYS, defaultKeys: ATTRIBUTION_DEFAULT_KEYS })
      for (const w of diagnose(step, data)) {
        warnings.push(w)
        log('WARN ' + w)
      }
      if (step < count - 1) {
        await page.keyboard.press('ArrowRight')
        try {
          await page.waitForFunction((n) => document.querySelector('[data-step-index]')?.getAttribute('data-step-index') === String(n), step + 1, { timeout: DEFAULTS.stepTimeoutMs })
        } catch {
          throw new Error(`navigation failed: step ${step + 1} did not advance to ${step + 2}`)
        }
      }
    }
    log(`inspect: ${shots} screenshots in ${path.relative(root, outDir) || '.'}, ${warnings.length} advisory warning(s) (warnings do not fail the run)`)
    return { shots, warnings }
  } finally {
    await browser?.close().catch(() => {})
    await stopPreview(preview)
  }
}

async function main() {
  try {
    await inspect(parseArgs(process.argv.slice(2)))
  } catch (error) {
    console.error(`INSPECT FAIL: ${error.message}`)
    process.exit(1)
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main()
