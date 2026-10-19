// Pure, browser-independent logic for scripts/inspect-presentation.mjs.
// Everything here is advisory-diagnostic math over plain data snapshots.

/** Default time (ms) to wait after a step change before capturing a screenshot. */
export const SETTLE_MS = 1000
/** Minimum attribution font size (computed px) before it is called too small. */
export const MIN_ATTRIBUTION_FONT_PX = 12
export const DESKTOP_VIEWPORT = { width: 1440, height: 900 }
export const NARROW_VIEWPORT = { width: 390, height: 844 }
export const ATTRIBUTION_SELECTOR = '[data-presentation-attribution]'
export const ALLOW_OVERLAP_ATTRIBUTE = 'data-presentation-allow-overlap'

/** Computed-style properties compared for active-vs-inactive chrome. */
export const DISTINCTNESS_PROPS = [
  'color',
  'backgroundColor',
  'border',
  'opacity',
  'fontWeight',
  'textDecoration',
]

export function parseArgs(argv) {
  const opts = { slug: undefined, narrow: false, out: undefined, settle: undefined }
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--narrow') opts.narrow = true
    else if (arg === '--out') opts.out = argv[++i]
    else if (arg.startsWith('--out=')) opts.out = arg.slice(6)
    else if (arg === '--settle') opts.settle = Number(argv[++i])
    else if (arg.startsWith('--settle=')) opts.settle = Number(arg.slice(9))
    else if (arg.startsWith('--')) throw new Error(`unknown option ${arg}`)
    else if (opts.slug === undefined) opts.slug = arg
    else throw new Error(`unexpected argument ${arg}`)
  }
  if (!opts.slug) throw new Error('usage: inspect-presentation <slug> [--narrow] [--out dir] [--settle ms]')
  if (opts.settle !== undefined && !(opts.settle >= 0)) throw new Error('--settle must be a non-negative number of milliseconds')
  return opts
}

export function stepFileName(index) {
  return `step-${String(index + 1).padStart(2, '0')}.png`
}

/** Waits the settle interval; `sleep` is injectable so tests can use fake timers. */
export async function settle(ms = SETTLE_MS, sleep = (n) => new Promise((r) => setTimeout(r, n))) {
  await sleep(ms)
}

export function rectIntersectionArea(a, b) {
  const w = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x)
  const h = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y)
  return w > 0 && h > 0 ? w * h : 0
}

function isVisible(item) {
  return item.visible !== false && item.rect.width > 0 && item.rect.height > 0
}

/** True when one DOM path (e.g. "0.2") is a proper prefix of the other. */
function isAncestorPath(a, b) {
  if (a === b) return true
  return b.startsWith(`${a}.`) || a.startsWith(`${b}.`)
}

/**
 * items: { selector, path, rect:{x,y,width,height}, visible?, allowOverlap? }.
 * Returns colliding pairs of visible items with positive-area intersection, skipping
 * ancestor/descendant pairs and anything inside an allow-overlap subtree.
 */
export function findOverlaps(items) {
  const candidates = items.filter((it) => isVisible(it) && !it.allowOverlap)
  const pairs = []
  for (let i = 0; i < candidates.length; i++) {
    for (let j = i + 1; j < candidates.length; j++) {
      const a = candidates[i]
      const b = candidates[j]
      if (isAncestorPath(a.path, b.path)) continue
      const area = rectIntersectionArea(a.rect, b.rect)
      if (area > 0) pairs.push({ a: a.selector, b: b.selector, area })
    }
  }
  return pairs
}

/** Names of the compared properties that differ between active and inactive style snapshots. */
export function differingStyleProps(active, inactive) {
  return DISTINCTNESS_PROPS.filter((p) => active[p] !== inactive[p])
}

/** Chrome is indistinct when every compared property equals the inactive sibling's. */
export function isIndistinctActive(active, inactive) {
  return differingStyleProps(active, inactive).length === 0
}

/**
 * info: null when attribution is absent, else
 * { fontSize (px number), color, fontFamily, textDecoration, defaults:{color,fontFamily,textDecoration} }.
 * Returns a list of problem strings (empty when polished).
 */
export function attributionProblems(info) {
  if (!info) return ['missing']
  const problems = []
  if (info.fontSize < MIN_ATTRIBUTION_FONT_PX) problems.push(`font-size ${info.fontSize}px is under ${MIN_ATTRIBUTION_FONT_PX}px`)
  const d = info.defaults
  if (d && info.color === d.color && info.fontFamily === d.fontFamily && info.textDecoration === d.textDecoration) {
    problems.push('browser-default link styling')
  }
  return problems
}

export function formatWarning(step, kind, detail) {
  return `[inspect] WARN step=${step} ${kind}: ${detail}`
}

/**
 * Builds the advisory warning lines for one step (step is one-based, matching step-NN.png).
 * snapshot: { overlapItems, active:[{chrome, active, inactive}], attribution }
 */
export function stepWarnings(step, snapshot) {
  const out = []
  for (const p of findOverlaps(snapshot.overlapItems)) out.push(formatWarning(step, 'overlap', `${p.a} <-> ${p.b}`))
  for (const c of snapshot.active) {
    if (c.active && c.inactive && isIndistinctActive(c.active, c.inactive)) {
      out.push(formatWarning(step, 'indistinct-active', `${c.chrome} active state looks identical to inactive items; style [data-presentation-active="true"]`))
    }
  }
  const problems = attributionProblems(snapshot.attribution)
  if (problems.length) {
    out.push(formatWarning(step, 'attribution', `${problems.join('; ')}; style ${ATTRIBUTION_SELECTOR}`))
  }
  return out
}
