// Pure helpers for the screenshot helper: output paths, capture ordering, and
// advisory visual diagnostics. Nothing here touches a browser.

export const DEFAULT_SETTLE_MS = 1200
export const DEFAULT_VIEWPORT = { width: 1440, height: 900 }
export const NARROW_VIEWPORT = { width: 390, height: 844 }
export const MIN_ATTRIBUTION_PX = 11
const UA_LINK_COLOR = 'rgb(0, 0, 238)'
const UA_SERIF = /^"?(times new roman|times|serif)"?$/i

export function parseViewport(text) {
  const match = /^(\d+)x(\d+)$/.exec(text ?? '')
  if (!match) throw new Error(`invalid viewport "${text}", expected WIDTHxHEIGHT`)
  return { width: Number(match[1]), height: Number(match[2]) }
}

export function parseArgs(argv) {
  const options = { slug: undefined, settleMs: DEFAULT_SETTLE_MS, viewport: undefined, build: true }
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg === '--settle') options.settleMs = Number(argv[++i])
    else if (arg === '--viewport') options.viewport = parseViewport(argv[++i])
    else if (arg === '--narrow') options.viewport = NARROW_VIEWPORT
    else if (arg === '--skip-build') options.build = false
    else if (arg.startsWith('--')) throw new Error(`unknown option ${arg}`)
    else options.slug = arg
  }
  if (!options.slug) throw new Error('usage: npm run inspect -- <slug> [--narrow | --viewport WxH] [--settle ms] [--skip-build]')
  if (!Number.isFinite(options.settleMs) || options.settleMs < 0) throw new Error('--settle needs a non-negative number')
  return options
}

/** Wide captures go to `.inspection/<slug>/`, other viewports to `.inspection/<slug>/<WxH>/`. */
export function screenshotDir(slug, viewport) {
  const base = `.inspection/${slug}`
  if (!viewport) return base
  return `${base}/${viewport.width}x${viewport.height}`
}

export function screenshotName(index) {
  return `step-${String(index + 1).padStart(2, '0')}.png`
}

/** Visits each step, waits out the settle interval, then captures; warnings follow the capture. */
export async function captureSteps({ count, goTo, wait, settleMs, capture }) {
  for (let index = 0; index < count; index += 1) {
    await goTo(index)
    await wait(settleMs)
    await capture(index)
  }
}

function area(rect) {
  return Math.max(0, rect.width) * Math.max(0, rect.height)
}

export function rectsOverlap(a, b) {
  const width = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x)
  const height = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y)
  return width > 0 && height > 0
}

/**
 * Pairs of visible items whose boxes intersect. Items inside an allow-overlap subtree
 * (`allowOverlap`) and items nested in one another (`containedBy`) are exempt.
 */
export function findOverlaps(items) {
  const visible = items.filter((item) => item.visible !== false && area(item.rect) > 0)
  const pairs = []
  for (let i = 0; i < visible.length; i += 1) {
    for (let j = i + 1; j < visible.length; j += 1) {
      const a = visible[i]
      const b = visible[j]
      if (a.allowOverlap || b.allowOverlap) continue
      if (a.containedBy?.includes(b.key) || b.containedBy?.includes(a.key)) continue
      if (rectsOverlap(a.rect, b.rect)) pairs.push([a, b])
    }
  }
  return pairs
}

const ACTIVE_STYLE_PROPERTIES = ['color', 'backgroundColor', 'fontWeight', 'opacity', 'borderColor', 'boxShadow']

/** True when no visual property separates the active item from an inactive sibling. */
export function isIndistinct(active, inactive) {
  return ACTIVE_STYLE_PROPERTIES.every((property) => active[property] === inactive[property])
}

/** Advisory problems with an attribution link's computed style, or `[]` when it looks intentional. */
export function attributionProblems(style) {
  if (!style) return ['no attribution link with data-presentation-attribution was found']
  const problems = []
  if (style.fontSize < MIN_ATTRIBUTION_PX) {
    problems.push(`font size ${style.fontSize}px is under ${MIN_ATTRIBUTION_PX}px`)
  }
  const firstFamily = String(style.fontFamily).split(',')[0].trim()
  if (style.color === UA_LINK_COLOR && UA_SERIF.test(firstFamily)) {
    problems.push('still uses the browser-default link color and serif font')
  }
  return problems
}

export function describe(item) {
  return `${item.label}${item.text ? ` "${item.text}"` : ''}`
}

/** Turns one step's measurements into printable advisory warnings. */
export function stepWarnings(step, { items, progress, toc, attribution }) {
  const warnings = []
  for (const [a, b] of findOverlaps(items)) {
    warnings.push(`warning: step ${step}: ${describe(a)} overlaps ${describe(b)} (mark an intentional overlap with data-presentation-allow-overlap)`)
  }
  if (progress && isIndistinct(progress.active, progress.inactive)) {
    warnings.push(`warning: step ${step}: active progress indicator looks the same as inactive ones; style [data-presentation-active]`)
  }
  if (toc && isIndistinct(toc.active, toc.inactive)) {
    warnings.push(`warning: step ${step}: active table-of-contents entry looks the same as inactive ones; style [data-presentation-active]`)
  }
  for (const problem of attributionProblems(attribution)) {
    warnings.push(`warning: step ${step}: attribution ${problem}; style [data-presentation-attribution]`)
  }
  return warnings
}
