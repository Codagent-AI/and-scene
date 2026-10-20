// Screenshot helper for visual review: `npm run inspect -- <slug> [--narrow] [--settle-ms N] [--no-build]`.
// Captures every step from a production preview into inspection/<slug>/step-NN.png and prints
// advisory `WARN step N: ...` lines. Warnings never change the exit status; capture failures do.
import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { launchChromium, projectRoot, registrySlugs, run, sleep, startPreview } from './lib/common.mjs'

export const DEFAULTS = {
  desktop: { width: 1440, height: 900 },
  narrow: { width: 390, height: 844 },
  settleMs: 1000,
  minAttributionPx: 12,
  overlapPx: 2,
}

const BROWSER_DEFAULT_LINK_COLORS = new Set(['rgb(0, 0, 238)', 'rgb(85, 26, 139)'])

/**
 * Computed properties that make an active control look different from its inactive siblings.
 * Width only counts for controls without text: with labels, label length alone would make every
 * entry look distinct.
 */
export const ACTIVE_STYLE_PROPS = [
  'color',
  'backgroundColor',
  'borderTopColor',
  'opacity',
  'fontWeight',
  'textDecorationLine',
  'boxShadow',
  'outlineStyle',
  'outlineColor',
  'outlineWidth',
  'width',
  'height',
]

export function parseArgs(argv) {
  const options = { slug: null, narrow: false, build: true, settleMs: DEFAULTS.settleMs, out: null, mode: 'browse' }
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--narrow') options.narrow = true
    else if (arg === '--no-build') options.build = false
    else if (arg === '--settle-ms') options.settleMs = Number(argv[++i])
    else if (arg === '--out') options.out = argv[++i]
    else if (arg === '--mode') options.mode = argv[++i]
    else if (!arg.startsWith('--') && !options.slug) options.slug = arg
    else throw new Error(`unknown argument: ${arg}`)
  }
  if (!Number.isFinite(options.settleMs) || options.settleMs < 0) throw new Error('--settle-ms needs a non-negative number')
  return options
}

const intersect = (a, b) => ({
  x: Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x),
  y: Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y),
})

/** Overlapping visible text/chrome pairs, skipping nested pairs and allow-overlap subtrees. */
export function overlapWarnings(items, threshold = DEFAULTS.overlapPx) {
  const warnings = []
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const a = items[i]
      const b = items[j]
      if (a.allowed || b.allowed || a.ancestors?.includes(b.id) || b.ancestors?.includes(a.id)) continue
      const overlap = intersect(a.rect, b.rect)
      if (overlap.x > threshold && overlap.y > threshold) {
        warnings.push(`text/chrome overlap: ${a.label} overlaps ${b.label} (mark intentional overlaps with data-presentation-allow-overlap)`)
      }
    }
  }
  return warnings
}

/** Chrome groups whose active control is computed-style identical to every inactive one. */
export function activeChromeWarnings(groups) {
  const warnings = []
  for (const group of groups) {
    if (!group.active || group.inactive.length === 0) continue
    const differs = (style) =>
      ACTIVE_STYLE_PROPS.some((prop) => (prop === 'width' && group.textDriven ? false : style[prop] !== group.active[prop]))
    if (!group.inactive.some(differs)) {
      warnings.push(`indistinct active chrome: active ${group.name} looks the same as inactive ones (style [data-presentation-active="true"])`)
    }
  }
  return warnings
}

export function attributionWarnings(attribution) {
  const hook = '[data-presentation-attribution]'
  if (!attribution) return [`attribution missing: no element matches ${hook}`]
  const warnings = []
  if (attribution.fontSizePx < DEFAULTS.minAttributionPx) {
    warnings.push(`attribution too small (${attribution.fontSizePx}px): style ${hook}`)
  }
  if (BROWSER_DEFAULT_LINK_COLORS.has(attribution.color)) {
    warnings.push(`attribution uses the browser-default link color: style ${hook}`)
  }
  if (!attribution.hasAuthorRule) {
    warnings.push(`attribution has no author styling rule: add one targeting ${hook}`)
  }
  return warnings
}

/** Merge identical warnings across steps: `WARN step 2: message (also steps 3, 4)`. */
export function formatWarnings(warnings) {
  const byMessage = new Map()
  for (const { step, message } of warnings) {
    if (!byMessage.has(message)) byMessage.set(message, [])
    byMessage.get(message).push(step)
  }
  return [...byMessage].map(([message, steps]) => {
    const also = steps.length > 1 ? ` (also steps ${steps.slice(1).join(', ')})` : ''
    return `WARN step ${steps[0]}: ${message}${also}`
  })
}

export const stepFileName = (step) => `step-${String(step).padStart(2, '0')}.png`

/**
 * Walk every step: advance, wait for the public index, wait the settle interval, then analyze and
 * screenshot. Dependencies are injected so the ordering can be tested with a fake clock.
 */
export async function captureSteps({ count, settleMs, advance, waitForIndex, sleep: wait, now, analyze, shoot }) {
  const warnings = []
  const captures = []
  for (let i = 0; i < count; i++) {
    const startedAt = now()
    if (i > 0) {
      await advance()
      await waitForIndex(i)
    }
    await wait(settleMs)
    const settledMs = now() - startedAt
    for (const message of await analyze(i)) warnings.push({ step: i + 1, message })
    await shoot(i + 1)
    captures.push({ step: i + 1, settledMs })
  }
  return { warnings, captures }
}

/** Runs in the page: raw measurements for the pure diagnostics above. */
function measurePage({ overlapSelector, styleProps }) {
  const visible = (el) => {
    const rect = el.getBoundingClientRect()
    if (rect.width <= 0 || rect.height <= 0 || getComputedStyle(el).visibility === 'hidden') return false
    // Opacity and display do not inherit, so every ancestor has to be checked.
    for (let node = el; node; node = node.parentElement) {
      const style = getComputedStyle(node)
      if (style.display === 'none' || Number(style.opacity) === 0) return false
    }
    return true
  }
  const root = document.querySelector('[data-presentation-root]')
  const chromeSelector = [
    '[data-presentation-progress-dot]',
    '[data-presentation-toc-entry]',
    '[data-presentation-prev]',
    '[data-presentation-next]',
    '[data-presentation-mode-toggle]',
    '[data-presentation-attribution]',
  ].join(',')
  const ownsText = (el) => [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim() !== '')
  const candidates = root ? [...root.querySelectorAll('*')].filter((el) => (ownsText(el) || el.matches(chromeSelector)) && visible(el)) : []
  const describe = (el) => {
    const hook = [...el.attributes].find((a) => a.name.startsWith('data-presentation-') && a.name !== 'data-presentation-allow-overlap')
    const text = (el.textContent ?? '').trim().slice(0, 24)
    return `${el.tagName.toLowerCase()}${hook ? `[${hook.name}]` : ''}${text ? ` "${text}"` : ''}`
  }
  const ancestorsOf = (el) => candidates.filter((c) => c !== el && c.contains(el)).map((c) => candidates.indexOf(c))
  const items = candidates.map((el, id) => {
    const r = el.getBoundingClientRect()
    return {
      id,
      label: describe(el),
      rect: { x: r.x, y: r.y, width: r.width, height: r.height },
      allowed: el.closest(overlapSelector) !== null,
      ancestors: ancestorsOf(el),
    }
  })

  const styleOf = (el) => {
    const cs = getComputedStyle(el)
    return Object.fromEntries(styleProps.map((p) => [p, cs[p]]))
  }
  const group = (name, selector) => {
    const all = [...document.querySelectorAll(selector)].filter(visible)
    const active = all.find((el) => el.getAttribute('data-presentation-active') === 'true' || el.hasAttribute('aria-current'))
    const textDriven = all.some((el) => (el.textContent ?? '').trim() !== '')
    return { name, textDriven, active: active ? styleOf(active) : null, inactive: all.filter((el) => el !== active).map(styleOf) }
  }
  const link = document.querySelector('[data-presentation-attribution]')
  let attribution = null
  if (link) {
    const cs = getComputedStyle(link)
    let hasAuthorRule = false
    const visit = (rules) => {
      for (const rule of rules) {
        if (rule.cssRules && !rule.selectorText) visit(rule.cssRules)
        else if (rule.selectorText && rule.selectorText.trim() !== '*' && link.matches(rule.selectorText)) hasAuthorRule = true
      }
    }
    for (const sheet of document.styleSheets) {
      try {
        visit(sheet.cssRules)
      } catch {
        // cross-origin sheet
      }
    }
    attribution = { fontSizePx: parseFloat(cs.fontSize), color: cs.color, hasAuthorRule }
  }
  return {
    items,
    groups: [group('progress indicator', '[data-presentation-progress-dot]'), group('table-of-contents entry', '[data-presentation-toc-entry]')],
    attribution,
    count: Number(root?.getAttribute('data-step-count') ?? 0),
  }
}

export const analyzeMeasurements = (data) => [
  ...overlapWarnings(data.items),
  ...activeChromeWarnings(data.groups),
  ...attributionWarnings(data.attribution),
]

async function capturePass({ page, origin, slug, viewport, outDir, options, log }) {
  mkdirSync(outDir, { recursive: true })
  await page.setViewportSize(viewport)
  await page.goto(`${origin}/${slug}`, { waitUntil: 'load' })
  await page.waitForSelector('[data-step-count]', { timeout: 10000 })
  if ((await page.getAttribute('[data-presentation-root]', 'data-presentation-mode')) !== options.mode) await page.keyboard.press('p')
  const count = Number(await page.getAttribute('[data-step-count]', 'data-step-count'))
  const measure = { overlapSelector: '[data-presentation-allow-overlap]', styleProps: ACTIVE_STYLE_PROPS }
  const result = await captureSteps({
    count,
    settleMs: options.settleMs,
    advance: () => page.keyboard.press('ArrowRight'),
    waitForIndex: (i) =>
      page.waitForFunction((n) => document.querySelector('[data-step-index]')?.getAttribute('data-step-index') === String(n), i, { timeout: 5000 }),
    sleep,
    now: () => Date.now(),
    analyze: async () => analyzeMeasurements(await page.evaluate(measurePage, measure)),
    shoot: async (step) => {
      const file = path.join(outDir, stepFileName(step))
      await page.screenshot({ path: file })
    },
  })
  for (const { step, settledMs } of result.captures) {
    log(`captured step ${step}/${count} after ${settledMs}ms settle: ${path.join(outDir, stepFileName(step))}`)
  }
  return result.warnings
}

export async function inspect(argv, { root = projectRoot, log = console.log } = {}) {
  let preview
  let browser
  try {
    const options = parseArgs(argv)
    const slugs = registrySlugs(root)
    if (!options.slug || !slugs.includes(options.slug)) {
      throw new Error(`usage: npm run inspect -- <slug>; registered slugs: ${slugs.join(', ') || '(none)'}`)
    }
    if (options.build) {
      const build = await run('npm', ['run', 'build'], { cwd: root })
      if (build.code !== 0) throw new Error(`npm run build failed\n${build.output.trim()}`)
    }
    preview = await startPreview(root)
    log(`preview: ${preview.origin} (pid ${preview.pid})`)
    browser = await launchChromium((await import('playwright')).chromium)
    const page = await browser.newPage()
    const base = path.resolve(root, options.out ?? 'inspection', options.slug)
    const passes = [{ viewport: DEFAULTS.desktop, outDir: base }]
    if (options.narrow) passes.push({ viewport: DEFAULTS.narrow, outDir: path.join(base, 'narrow') })
    const warnings = []
    for (const pass of passes) {
      const found = await capturePass({ page, origin: preview.origin, slug: options.slug, options, log, ...pass })
      const tag = pass.outDir === base ? '' : '[narrow] '
      warnings.push(...found.map((w) => ({ ...w, message: `${tag}${w.message}` })))
    }
    for (const line of formatWarnings(warnings)) log(line)
    log(warnings.length ? `done with ${warnings.length} advisory warning(s)` : 'done with no advisory warnings')
    return 0
  } catch (error) {
    log(`FAIL capture: ${error.message}`)
    return 1
  } finally {
    await browser?.close().catch(() => {})
    await preview?.stop()
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = await inspect(process.argv.slice(2))
}
