// Captures one settled screenshot per step of a registered presentation from a production preview
// and prints advisory visual warnings. Warnings never change the exit code.
// Usage: npm run inspect -- <slug> [--narrow] [--settle ms] [--no-build] [--out dir]
// Settle interval precedence: --settle flag, then INSPECT_SETTLE_MS, then DEFAULT_SETTLE_MS.
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { chromium } from 'playwright'
import { previewUrl, runBuild, startPreview } from './lib/preview.mjs'

export const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/
export const DEFAULT_SETTLE_MS = 1500
export const DESKTOP_VIEWPORT = { width: 1440, height: 900 }
export const NARROW_VIEWPORT = { width: 390, height: 844 }
export const MIN_ATTRIBUTION_FONT_PX = 11
export const UA_LINK_COLOR = 'rgb(0, 0, 238)'
export const OVERLAP_MIN_AREA_PX = 4
export const DISTINCT_PROPS = [
  'color', 'backgroundColor', 'borderColor', 'opacity', 'fontWeight', 'textDecorationLine',
  'boxShadow', 'outlineStyle', 'outlineColor', 'outlineWidth', 'width', 'height',
]

/** CLI flag beats environment, which beats the default. */
export function resolveSettle(argv, env) {
  const i = argv.indexOf('--settle')
  const fromFlag = i >= 0 ? Number(argv[i + 1]) : NaN
  if (Number.isFinite(fromFlag) && fromFlag >= 0) return fromFlag
  const fromEnv = Number(env.INSPECT_SETTLE_MS)
  if (env.INSPECT_SETTLE_MS !== undefined && Number.isFinite(fromEnv) && fromEnv >= 0) return fromEnv
  return DEFAULT_SETTLE_MS
}

export function parseArgs(argv, env = process.env) {
  const slug = argv.find((a, i) => !a.startsWith('--') && argv[i - 1] !== '--settle' && argv[i - 1] !== '--out')
  const o = argv.indexOf('--out')
  if (o >= 0 && (!argv[o + 1] || argv[o + 1].startsWith('--'))) throw new Error('--out requires a directory')
  return {
    slug,
    narrow: argv.includes('--narrow'),
    noBuild: argv.includes('--no-build'),
    settleMs: resolveSettle(argv, env),
    outDir: o >= 0 ? argv[o + 1] : 'inspection',
  }
}

export function screenshotName(index) {
  return `step-${String(index + 1).padStart(2, '0')}.png`
}

export const intersectionArea = (a, b) =>
  Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top))

/**
 * Items: { name, rect:{left,top,right,bottom}, visible, allowed, ancestors: string[] (names) }.
 * Only DOM ancestry (a text container and its own text, via `ancestors`) is exempt; unrelated elements whose
 * boxes nest or intersect still collide unless an allow-overlap marker covers them.
 */
export function findOverlaps(items) {
  const found = []
  const live = items.filter((it) => it.visible && !it.allowed)
  for (let i = 0; i < live.length; i++) {
    for (let j = i + 1; j < live.length; j++) {
      const a = live[i]
      const b = live[j]
      if (a.ancestors?.includes(b.name) || b.ancestors?.includes(a.name)) continue
      if (intersectionArea(a.rect, b.rect) >= OVERLAP_MIN_AREA_PX) found.push([a.name, b.name])
    }
  }
  return found
}

/** Active chrome is indistinct when no compared style differs from an inactive sibling. */
export function isIndistinct(active, inactive) {
  return DISTINCT_PROPS.every((p) => active[p] === inactive[p])
}

export function attributionIssues(attr) {
  if (!attr) return ['attribution link is missing']
  const issues = []
  if (attr.fontSizePx < MIN_ATTRIBUTION_FONT_PX) issues.push(`attribution font size ${attr.fontSizePx}px is below ${MIN_ATTRIBUTION_FONT_PX}px`)
  if (attr.color === UA_LINK_COLOR && attr.textDecorationLine.includes('underline')) issues.push('attribution uses the browser-default link style')
  return issues
}

/** Collects every advisory warning for one captured step. */
export function analyzeSnapshot(step, snapshot) {
  const warnings = []
  for (const [a, b] of findOverlaps(snapshot.items)) {
    warnings.push(`WARN step ${step}: overlap between ${a} and ${b} (mark intentional overlap with data-presentation-allow-overlap)`)
  }
  for (const group of snapshot.activeChrome) {
    if (group.inactive && isIndistinct(group.active, group.inactive)) {
      warnings.push(`WARN step ${step}: active ${group.hook} is visually indistinct from inactive ${group.hook}; style [data-presentation-active="true"]`)
    }
  }
  for (const issue of attributionIssues(snapshot.attribution)) {
    warnings.push(`WARN step ${step}: ${issue}; style [data-presentation-attribution]`)
  }
  return warnings
}

/** Runs in the page: gathers visible text/chrome rects and the computed styles the analysis needs. */
export function collectSnapshot(styleProps) {
  const CHROME = '[data-presentation-marker],[data-presentation-title],[data-presentation-caption],[data-presentation-prev],[data-presentation-next],[data-presentation-progress],[data-presentation-toc-entry],[data-presentation-attribution],[data-presentation-brand]'
  const describe = (el) => {
    const hook = [...el.attributes].find((a) => a.name.startsWith('data-presentation-') && a.name !== 'data-presentation-active' && a.name !== 'data-presentation-allow-overlap')
    const sample = el.getAttribute('data-sample')
    const base = sample ? `[data-sample="${sample}"]` : hook ? `[${hook.name}]` : el.tagName.toLowerCase()
    const text = (el.textContent || '').trim().slice(0, 24)
    return text ? `${base} "${text}"` : base
  }
  const isVisible = (el) => {
    const cs = getComputedStyle(el)
    const r = el.getBoundingClientRect()
    if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) === 0) return false
    for (let p = el.parentElement; p; p = p.parentElement) if (getComputedStyle(p).display === 'none') return false
    return r.width > 0 && r.height > 0
  }
  const rectOf = (el) => {
    const r = el.getBoundingClientRect()
    return { left: r.left, top: r.top, right: r.right, bottom: r.bottom }
  }
  const root = document.querySelector('[data-presentation-root]') ?? document.body
  const chrome = new Set(root.querySelectorAll(CHROME))
  const textLeaves = [...root.querySelectorAll('*')].filter(
    (el) => ![...el.childNodes].every((n) => n.nodeType !== 3 || !n.textContent.trim()) && !(el.closest('svg') && el.tagName.toLowerCase() !== 'text' && el.tagName.toLowerCase() !== 'tspan'),
  )
  const els = [...new Set([...chrome, ...textLeaves])]
  const names = new Map(els.map((el) => [el, describe(el)]))
  const items = els.map((el) => ({
    name: names.get(el),
    rect: rectOf(el),
    visible: isVisible(el),
    allowed: el.closest('[data-presentation-allow-overlap]') !== null,
    ancestors: els.filter((o) => o !== el && o.contains(el)).map((o) => names.get(o)),
  }))
  const styleOf = (el) => {
    const cs = getComputedStyle(el)
    return Object.fromEntries(styleProps.map((p) => [p, cs[p]]))
  }
  const activeChrome = ['progress', 'toc-entry'].flatMap((hook) => {
    const all = [...root.querySelectorAll(`[data-presentation-${hook}]`)].filter(isVisible)
    const active = all.find((el) => el.getAttribute('aria-current') === 'step')
    if (!active) return []
    const inactive = all.find((el) => el !== active)
    return [{ hook: `data-presentation-${hook}`, active: styleOf(active), inactive: inactive ? styleOf(inactive) : null }]
  })
  const a = root.querySelector('[data-presentation-attribution]')
  const attribution = a ? { fontSizePx: parseFloat(getComputedStyle(a).fontSize), color: getComputedStyle(a).color, textDecorationLine: getComputedStyle(a).textDecorationLine } : null
  return { items, activeChrome, attribution }
}

async function waitForIndex(page, expected, timeoutMs = 4000) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    const raw = await page.getAttribute('[data-step-index]', 'data-step-index').catch(() => null)
    if (Number(raw) === expected) return true
    await page.waitForTimeout(50)
  }
  return false
}

/**
 * Walks every step: advance, confirm the public step index, wait out the settle interval, then capture.
 * `page` needs keyboard.press, getAttribute, waitForTimeout, screenshot and evaluate.
 */
export async function captureSteps(page, { count, settleMs, dir, onWarning, log, now = Date.now, stepTimeoutMs = 4000 }) {
  for (let i = 0; i < count; i++) {
    if (i > 0) await page.keyboard.press('ArrowRight')
    const navigatedAt = now()
    if (!(await waitForIndex(page, i, stepTimeoutMs))) throw new Error(`step ${i + 1} did not become active`)
    await page.waitForTimeout(settleMs)
    const capturedAt = now()
    await page.screenshot({ path: path.join(dir, screenshotName(i)) })
    log.push({ step: i + 1, navigatedAt, capturedAt })
    for (const w of analyzeSnapshot(i + 1, await page.evaluate(collectSnapshot, DISTINCT_PROPS))) onWarning(w)
  }
}

export async function inspect({ root = process.cwd(), slug, narrow = false, noBuild = false, settleMs = DEFAULT_SETTLE_MS, outDir = 'inspection' }) {
  if (slug && !SLUG_PATTERN.test(slug)) throw new Error(`invalid slug "${slug}": use lowercase letters, digits and single hyphens`)
  if (!slug) throw new Error('usage: npm run inspect -- <slug> [--narrow] [--settle ms] [--no-build]')
  if (!noBuild) {
    const build = await runBuild(root)
    if (build.code !== 0) throw new Error(`build failed\n${build.output}`)
  }
  const dir = path.resolve(root, outDir, slug + (narrow ? '-narrow' : ''))
  await mkdir(dir, { recursive: true })
  const preview = await startPreview(root)
  let browser
  const warnings = []
  const log = []
  try {
    browser = await chromium.launch()
    const page = await browser.newPage({ viewport: narrow ? NARROW_VIEWPORT : DESKTOP_VIEWPORT })
    await page.goto(previewUrl(preview.port, `/${slug}`))
    await page.waitForSelector('[data-step-count]', { timeout: 10_000 })
    const count = Number(await page.getAttribute('[data-step-count]', 'data-step-count'))
    await captureSteps(page, { count, settleMs, dir, onWarning: (w) => (warnings.push(w), console.log(w)), log })
    await writeFile(path.join(dir, 'capture-log.json'), JSON.stringify({ settleMs, viewport: page.viewportSize(), log }, null, 2))
    console.log(`INSPECT: ${count} screenshots in ${path.relative(root, dir)}, ${warnings.length} advisory warning(s)`)
    return { dir, count, warnings, log }
  } finally {
    await browser?.close()
    await preview.stop()
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    await inspect(parseArgs(process.argv.slice(2)))
  } catch (err) {
    console.error(`INSPECT ERROR: ${err.message}`)
    process.exitCode = 1
  }
}
