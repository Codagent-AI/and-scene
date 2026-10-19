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
 * items: { selector, path, rect:{x,y,width,height}, visible?, hasOwnText?, allowOverlap? }.
 * Returns colliding pairs of visible items with positive-area intersection, skipping
 * ancestor/descendant pairs unless both carry own text (hasOwnText), and anything inside an allow-overlap subtree.
 */
export function findOverlaps(items) {
  const candidates = items.filter((it) => isVisible(it) && !it.allowOverlap)
  const pairs = []
  for (let i = 0; i < candidates.length; i++) {
    for (let j = i + 1; j < candidates.length; j++) {
      const a = candidates[i]
      const b = candidates[j]
      // Container/chrome-box wrappers legitimately enclose their descendants; two own-text
      // ranges are real content and may not collide even when nested.
      if (isAncestorPath(a.path, b.path) && !(a.hasOwnText && b.hasOwnText)) continue
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

/**
 * Runs inside the page (and under jsdom in unit tests). Must stay self-contained: it is
 * serialized by Playwright, so it may only touch globals. Collects the text/chrome boxes
 * used for overlap detection; `allowOverlap` is inherited from any marked ancestor.
 */
export function collectOverlapItems() {
  const root = document.querySelector('[data-presentation-root]')
  const CHROME = [
    'title', 'caption', 'marker', 'era', 'brand', 'prev', 'next', 'mode-toggle',
    'progress-item', 'toc-item', 'attribution',
  ].map((n) => `[data-presentation-${n}]`)
  const GENERIC = ['root', 'stage', 'canvas', 'scene', 'footer', 'header', 'toc', 'progress']
  const dataAttr = (el) =>
    el.getAttributeNames().find((n) => n.startsWith('data-presentation-') && !GENERIC.includes(n.slice(18)) && n !== 'data-presentation-active')
  const describeSelf = (el, attr) => {
    const v = el.getAttribute(attr)
    return `${el.tagName.toLowerCase()}[${attr}${v ? `="${v}"` : ''}]`
  }
  const describe = (el) => {
    const own = dataAttr(el)
    const direct = ownTextNodes(el).map((n) => n.textContent.trim()).join(' ').replace(/\s+/g, ' ').slice(0, 24)
    const quoted = direct ? ` "${direct}"` : ''
    const tag = el.tagName.toLowerCase()
    const self = own ? describeSelf(el, own) : tag
    const entity = el.closest('[data-presentation-entity]')
    if (entity && entity !== el) return `${describeSelf(entity, 'data-presentation-entity')} > ${self}${quoted}`
    if (own) return `${self}${quoted}`
    let anchor = el.parentElement
    while (anchor && anchor !== root && !dataAttr(anchor)) anchor = anchor.parentElement
    if (anchor && anchor !== root) return `${describeSelf(anchor, dataAttr(anchor))} > ${self}${quoted}`
    return `${self}${quoted}`
  }
  const pathOf = (el) => {
    const parts = []
    for (let n = el; n && n !== document.documentElement; n = n.parentElement) {
      parts.unshift(n.parentElement ? Array.prototype.indexOf.call(n.parentElement.children, n) : 0)
    }
    return parts.join('.')
  }
  const visibleStyle = (el) => {
    let opacity = 1
    for (let n = el; n; n = n.parentElement) {
      const cs = getComputedStyle(n)
      if (cs.display === 'none') return false
      opacity *= Number(cs.opacity)
    }
    const cs = getComputedStyle(el)
    return cs.visibility !== 'hidden' && opacity > 0.01
  }
  const ownTextNodes = (el) =>
    Array.from(el.childNodes).filter((n) => n.nodeType === Node.TEXT_NODE && n.textContent.trim() !== '')
  const textRect = (el) => {
    const range = document.createRange()
    const nodes = ownTextNodes(el)
    range.setStartBefore(nodes[0])
    range.setEndAfter(nodes[nodes.length - 1])
    return range.getBoundingClientRect()
  }
  const toRect = (r) => ({ x: r.x, y: r.y, width: r.width, height: r.height })

  const overlapItems = []
  if (root) {
    const seen = new Set()
    const consider = (el) => {
      if (seen.has(el) || ['STYLE', 'SCRIPT'].includes(el.tagName)) return
      seen.add(el)
      const hasText = ownTextNodes(el).length > 0
      const isChrome = CHROME.some((s) => el.matches(s))
      if (!hasText && !isChrome) return
      const rect = hasText ? textRect(el) : el.getBoundingClientRect()
      overlapItems.push({
        selector: describe(el),
        path: pathOf(el),
        rect: toRect(rect),
        visible: visibleStyle(el),
        hasOwnText: hasText,
        allowOverlap: el.closest('[data-presentation-allow-overlap]') !== null,
      })
    }
    root.querySelectorAll('*').forEach(consider)
  }
  return overlapItems
}
