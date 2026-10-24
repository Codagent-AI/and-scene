// Advisory visual diagnostics. `extractSnapshot` runs in the page and returns
// plain data; every other function here is a pure analysis of that data.

/** Intersection must exceed this many px in both dimensions to count as an overlap. */
export const OVERLAP_MIN_PX = 1
/** Attribution smaller than this computed font size (px) is flagged. */
export const ATTRIBUTION_MIN_FONT_PX = 11
/** Computed styles compared to decide whether the active item stands out. */
export const ACTIVE_STYLE_PROPS = [
  'color',
  'backgroundColor',
  'borderTopColor',
  'borderTopWidth',
  'borderTopStyle',
  'outlineColor',
  'outlineWidth',
  'outlineStyle',
  'opacity',
  'fontWeight',
]
export const BROWSER_DEFAULT_LINK_COLORS = ['rgb(0, 0, 238)', 'rgb(85, 26, 139)']

/** Runs in the page. Must stay self-contained (it is serialized into the browser). */
export function extractSnapshot() {
  const root = document.querySelector('[data-presentation-root]')
  const ACTIVE = [
    'color', 'backgroundColor', 'borderTopColor', 'borderTopWidth', 'borderTopStyle',
    'outlineColor', 'outlineWidth', 'outlineStyle', 'opacity', 'fontWeight',
  ]
  const visible = (el) => {
    for (let n = el; n && n !== document.documentElement; n = n.parentElement) {
      const s = getComputedStyle(n)
      if (s.display === 'none' || s.visibility === 'hidden' || Number(s.opacity) === 0) return false
    }
    return true
  }
  const describe = (el) => {
    const hook = [...el.attributes].find((a) => a.name.startsWith('data-presentation-'))
    const text = (el.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 40)
    return `<${el.localName}${hook ? ` ${hook.name}` : ''}>${text ? ` "${text}"` : ''}`
  }
  const textRect = (el) => {
    const range = document.createRange()
    let rect = null
    for (const node of el.childNodes) {
      if (node.nodeType !== Node.TEXT_NODE || !node.textContent.trim()) continue
      range.selectNodeContents(node)
      const r = range.getBoundingClientRect()
      if (!rect) rect = { l: r.left, t: r.top, r: r.right, b: r.bottom }
      else rect = { l: Math.min(rect.l, r.left), t: Math.min(rect.t, r.top), r: Math.max(rect.r, r.right), b: Math.max(rect.b, r.bottom) }
    }
    return rect
  }
  const items = []
  const byEl = new Map()
  const add = (el, rect) => {
    if (!rect || rect.r - rect.l <= 0 || rect.b - rect.t <= 0 || !visible(el)) return
    const ancestors = []
    for (let n = el.parentElement; n; n = n.parentElement) if (byEl.has(n)) ancestors.push(byEl.get(n))
    const id = items.length
    byEl.set(el, id)
    items.push({
      id,
      label: describe(el),
      rect: { x: rect.l, y: rect.t, w: rect.r - rect.l, h: rect.b - rect.t },
      allowed: el.closest('[data-presentation-allow-overlap]') !== null,
      ancestors,
    })
  }
  if (root) {
    const all = [root, ...root.querySelectorAll('*')]
    for (const el of all) {
      if (el.matches('[data-presentation-chrome]')) {
        const r = el.getBoundingClientRect()
        add(el, { l: r.left, t: r.top, r: r.right, b: r.bottom })
      } else if (textRect(el)) add(el, textRect(el))
    }
  }
  const style = (el) => {
    const s = getComputedStyle(el)
    const out = {}
    for (const p of ACTIVE) out[p] = s[p]
    out.fontSize = s.fontSize
    out.textDecorationLine = s.textDecorationLine
    return out
  }
  const group = (sel) =>
    [...document.querySelectorAll(sel)].map((el) => ({
      label: describe(el),
      active: el.hasAttribute('data-presentation-active') || el.getAttribute('aria-current') === 'step',
      style: style(el),
    }))
  const link = document.querySelector('[data-presentation-attribution]')
  return {
    items,
    progress: group('[data-presentation-progress-item]'),
    toc: group('[data-presentation-toc-item]'),
    attribution: link ? { label: describe(link), style: style(link) } : null,
  }
}

const overlaps = (a, b) =>
  Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x) > OVERLAP_MIN_PX &&
  Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y) > OVERLAP_MIN_PX

/** Unmarked collisions between visible text/chrome elements that are not nested in each other. */
export function findOverlaps(items) {
  const found = []
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const a = items[i]
      const b = items[j]
      if (a.allowed || b.allowed) continue
      if (a.ancestors.includes(b.id) || b.ancestors.includes(a.id)) continue
      if (overlaps(a.rect, b.rect)) found.push([a.label, b.label])
    }
  }
  return found
}

const sameStyle = (a, b) => ACTIVE_STYLE_PROPS.every((p) => a[p] === b[p])

/** Is the active item visually indistinct from its inactive siblings? Safe when none exist. */
export function indistinctActive(group) {
  const active = group.find((g) => g.active)
  const inactive = group.filter((g) => !g.active)
  if (!active || inactive.length === 0) return false
  return inactive.every((g) => sameStyle(active.style, g.style))
}

/** Problems with the attribution link; empty when it looks authored and legible. */
export function attributionIssues(attribution) {
  if (!attribution) return ['no attribution link ([data-presentation-attribution]) is rendered']
  const issues = []
  const { fontSize, color, textDecorationLine } = attribution.style
  if (parseFloat(fontSize) < ATTRIBUTION_MIN_FONT_PX) issues.push(`font size ${fontSize} is under ${ATTRIBUTION_MIN_FONT_PX}px`)
  if (BROWSER_DEFAULT_LINK_COLORS.includes(color) && textDecorationLine.includes('underline')) {
    issues.push('it still has the browser-default link look')
  }
  return issues
}

/** Advisory warnings for one step's snapshot: { step, kind, message }. */
export function analyzeSnapshot(step, snapshot) {
  const warnings = []
  const warn = (kind, message) => warnings.push({ step, kind, message })
  for (const [a, b] of findOverlaps(snapshot.items)) warn('overlap', `${a} overlaps ${b} (mark intentional overlap with data-presentation-allow-overlap)`)
  if (indistinctActive(snapshot.progress)) warn('active-chrome', 'the active progress indicator looks the same as inactive ones ([data-presentation-progress-item][data-presentation-active])')
  if (indistinctActive(snapshot.toc)) warn('active-chrome', 'the active table-of-contents entry looks the same as inactive ones ([data-presentation-toc-item][data-presentation-active])')
  const issues = attributionIssues(snapshot.attribution)
  if (issues.length > 0) warn('attribution', `${issues.join('; ')}; style [data-presentation-attribution]`)
  return warnings
}
