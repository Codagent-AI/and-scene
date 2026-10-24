// Pure helpers for the screenshot/diagnostic helper. Everything except `collectSnapshot`
// is plain data-in/data-out so it can be unit-tested without a browser.

/** Longer than a newcomer's layout wait plus fade-in (see presentation-kit constants). */
export const DEFAULT_SETTLE_MS = 1500
export const MIN_ATTRIBUTION_PX = 11
export const BROWSER_DEFAULT_LINK_COLORS = ['rgb(0, 0, 238)', 'rgb(85, 26, 139)']

/** `<out>/<slug>[/<variant>]/step-NN.png`, one-based and zero-padded. */
export function screenshotPath(outDir, slug, index, variant) {
  const name = `step-${String(index + 1).padStart(2, '0')}.png`
  return [outDir, slug, ...(variant ? [variant] : []), name].join('/')
}

/**
 * Visit every step, wait for the transition to settle, then capture it.
 * `advance(i)` moves to step i (a no-op for the first step); `sleep` waits `settleMs`.
 */
export async function captureSequence({ count, advance, sleep, capture, settleMs = DEFAULT_SETTLE_MS }) {
  for (let i = 0; i < count; i++) {
    await advance(i)
    await sleep(settleMs)
    await capture(i)
  }
}

export function rectsOverlap(a, b) {
  const w = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)
  const h = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y)
  return w > 1 && h > 1
}

/**
 * Element: { uid, name, rect:{x,y,w,h}, allow:boolean, ancestors:number[] }.
 * Elements inside an allow-overlap subtree are exempt; nesting pairs are not collisions.
 */
export function findOverlaps(elements) {
  const found = []
  for (let i = 0; i < elements.length; i++) {
    for (let j = i + 1; j < elements.length; j++) {
      const a = elements[i]
      const b = elements[j]
      if (a.allow || b.allow) continue
      if (a.ancestors.includes(b.uid) || b.ancestors.includes(a.uid)) continue
      if (rectsOverlap(a.rect, b.rect)) found.push([a.name, b.name])
    }
  }
  return found
}

const STYLE_KEYS = [
  'color',
  'backgroundColor',
  'borderColor',
  'borderWidth',
  'width',
  'height',
  'transform',
  'opacity',
  'fontWeight',
  'textDecorationLine',
  'boxShadow',
  'outlineStyle',
]

/** True when the active entry's computed style matches an inactive one on every visual property. */
export function isIndistinct(active, inactive) {
  return STYLE_KEYS.every((key) => active[key] === inactive[key])
}

/** attr: null (missing) or { fontSize:number, color:string }. Returns issue strings. */
export function attributionIssues(attr) {
  if (!attr) return ['is missing']
  const issues = []
  if (attr.fontSize < MIN_ATTRIBUTION_PX) issues.push(`is too small (${attr.fontSize}px)`)
  if (BROWSER_DEFAULT_LINK_COLORS.includes(attr.color)) issues.push('uses the browser-default link color')
  return issues
}

/** Turn one step's snapshot into advisory warning lines. */
export function stepWarnings(step, snapshot) {
  const warnings = []
  for (const [a, b] of findOverlaps(snapshot.elements)) {
    warnings.push(`WARN step ${step} [overlap] ${a} overlaps ${b}`)
  }
  for (const [kind, pair] of Object.entries(snapshot.active)) {
    if (pair && isIndistinct(pair.active, pair.inactive)) {
      warnings.push(`WARN step ${step} [active-${kind}] active ${kind} entry looks the same as inactive ones; style [data-presentation-active]`)
    }
  }
  for (const issue of attributionIssues(snapshot.attribution)) {
    warnings.push(`WARN step ${step} [attribution] attribution link ${issue}; style [data-presentation-attribution]`)
  }
  return warnings
}

/** Runs inside the page (serialized by Playwright): must not reference anything outside itself. */
export function collectSnapshot() {
  const root = document.querySelector('[data-presentation-root]')
  if (!root) return { elements: [], active: {}, attribution: null }
  const CONTROLS =
    '[data-presentation-progress-item],[data-presentation-prev],[data-presentation-next],[data-presentation-mode-toggle],[data-presentation-toc-item],[data-presentation-attribution]'
  const visible = (el) => {
    const s = getComputedStyle(el)
    return s.display !== 'none' && s.visibility !== 'hidden' && Number(s.opacity) > 0
  }
  const describe = (el) => {
    const hook = el.getAttributeNames().find((n) => n.startsWith('data-presentation-') || n === 'data-role' || n === 'data-card-part')
    const text = (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 32)
    return `${el.tagName.toLowerCase()}${hook ? `[${hook}${el.getAttribute(hook) ? `="${el.getAttribute(hook)}"` : ''}]` : ''}${text ? ` "${text}"` : ''}`
  }
  const textRect = (el) => {
    const range = document.createRange()
    let rect = null
    for (const node of el.childNodes) {
      if (node.nodeType !== Node.TEXT_NODE || !node.textContent.trim()) continue
      range.selectNodeContents(node)
      const r = range.getBoundingClientRect()
      if (!r.width || !r.height) continue
      rect = rect
        ? { x1: Math.min(rect.x1, r.left), y1: Math.min(rect.y1, r.top), x2: Math.max(rect.x2, r.right), y2: Math.max(rect.y2, r.bottom) }
        : { x1: r.left, y1: r.top, x2: r.right, y2: r.bottom }
    }
    return rect && { x: rect.x1, y: rect.y1, w: rect.x2 - rect.x1, h: rect.y2 - rect.y1 }
  }
  const picked = []
  for (const el of root.querySelectorAll('*')) {
    if (!visible(el)) continue
    const isControl = el.matches(CONTROLS)
    const rect = isControl ? (({ left, top, width, height }) => ({ x: left, y: top, w: width, h: height }))(el.getBoundingClientRect()) : textRect(el)
    if (!rect || !rect.w || !rect.h) continue
    picked.push({ el, rect: isControl && el.textContent.trim() ? (textRect(el) ?? rect) : rect })
  }
  const uids = new Map(picked.map((p, i) => [p.el, i]))
  const elements = picked.map(({ el, rect }, uid) => {
    const ancestors = []
    for (let p = el.parentElement; p && p !== root; p = p.parentElement) if (uids.has(p)) ancestors.push(uids.get(p))
    return { uid, name: describe(el), rect, allow: el.closest('[data-presentation-allow-overlap]') !== null, ancestors }
  })
  const styleOf = (el) => {
    const s = getComputedStyle(el)
    return Object.fromEntries(
      ['color', 'backgroundColor', 'borderColor', 'borderWidth', 'width', 'height', 'transform', 'opacity', 'fontWeight', 'textDecorationLine', 'boxShadow', 'outlineStyle'].map((k) => [k, s[k]]),
    )
  }
  const pairFor = (selector) => {
    const items = [...root.querySelectorAll(selector)].filter(visible)
    const active = items.find((el) => el.hasAttribute('data-presentation-active'))
    const inactive = items.find((el) => !el.hasAttribute('data-presentation-active'))
    return active && inactive ? { active: styleOf(active), inactive: styleOf(inactive) } : null
  }
  const attr = root.querySelector('[data-presentation-attribution]')
  const attrStyle = attr && getComputedStyle(attr)
  return {
    elements,
    active: { progress: pairFor('[data-presentation-progress-item]'), toc: pairFor('[data-presentation-toc-item]') },
    attribution: attr ? { fontSize: parseFloat(attrStyle.fontSize), color: attrStyle.color } : null,
  }
}
