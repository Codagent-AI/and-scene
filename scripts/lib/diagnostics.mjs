// Advisory visual diagnostics. `evaluate*` functions are pure; `collectSnapshot`
// is the thin in-browser part (serialized into the page by Playwright).

// ---- Thresholds ----
export const THRESHOLDS = {
  /** Minimum intersection area (px²) for two text/chrome boxes to count as overlapping. */
  overlapMinArea: 12,
  /** Minimum intersection as a fraction of the smaller box. */
  overlapMinRatio: 0.08,
  /** Per-channel-summed RGB distance that makes two colors visibly different. */
  colorDeltaMin: 48,
  sizeDeltaMinPx: 2,
  fontWeightDeltaMin: 100,
  opacityDeltaMin: 0.15,
  /** Attribution below this font size (px) or box height (px) is "too small". */
  attributionMinFontPx: 11,
  attributionMinHeightPx: 12,
}

const DEFAULT_LINK_COLORS = ['rgb(0, 0, 238)', 'rgb(85, 26, 139)', 'rgb(255, 0, 0)', 'rgb(0, 0, 255)']

function intersection(a, b) {
  const w = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)
  const h = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y)
  return w > 0 && h > 0 ? w * h : 0
}

/**
 * elements: [{ uid, label, rect:{x,y,w,h}, allowed, ancestors:[uid] }]
 * Returns [{ a, b }] label pairs for overlaps not exempted by allow-overlap.
 */
export function evaluateOverlaps(elements, t = THRESHOLDS) {
  const out = []
  for (let i = 0; i < elements.length; i++) {
    for (let j = i + 1; j < elements.length; j++) {
      const a = elements[i]
      const b = elements[j]
      if (a.allowed || b.allowed) continue
      if (a.ancestors.includes(b.uid) || b.ancestors.includes(a.uid)) continue
      const area = intersection(a.rect, b.rect)
      const smaller = Math.min(a.rect.w * a.rect.h, b.rect.w * b.rect.h)
      if (area >= t.overlapMinArea && smaller > 0 && area / smaller >= t.overlapMinRatio) {
        out.push({ a: a.label, b: b.label })
      }
    }
  }
  return out
}

function rgb(str) {
  const m = /rgba?\(([^)]+)\)/.exec(str ?? '')
  if (!m) return null
  const [r, g, b, a = 1] = m[1].split(/[ ,/]+/).filter(Boolean).map(Number)
  return { r, g, b, a }
}

function colorDiffers(x, y, t) {
  if (x === y) return false
  const a = rgb(x)
  const b = rgb(y)
  if (!a || !b) return true
  return Math.abs(a.r - b.r) + Math.abs(a.g - b.g) + Math.abs(a.b - b.b) + Math.abs(a.a - b.a) * 255 >= t.colorDeltaMin
}

/** True when two computed-style snapshots differ visibly in any tracked property. */
export function stylesDistinct(active, inactive, t = THRESHOLDS) {
  for (const k of ['backgroundColor', 'color', 'borderTopColor', 'borderLeftColor', 'outlineColor']) {
    if (colorDiffers(active[k], inactive[k], t)) return true
  }
  for (const k of ['width', 'height']) {
    if (Math.abs(parseFloat(active[k]) - parseFloat(inactive[k])) >= t.sizeDeltaMinPx) return true
  }
  if (Math.abs(Number(active.fontWeight) - Number(inactive.fontWeight)) >= t.fontWeightDeltaMin) return true
  if (Math.abs(Number(active.opacity) - Number(inactive.opacity)) >= t.opacityDeltaMin) return true
  for (const k of ['boxShadow', 'textDecorationLine', 'transform', 'borderTopWidth', 'borderLeftWidth']) {
    if (active[k] !== inactive[k]) return true
  }
  return false
}

/**
 * groups: [{ name, items:[{ label, active, style }] }]
 * Warns for each group whose active item matches an inactive sibling.
 */
export function evaluateActiveChrome(groups, t = THRESHOLDS) {
  const out = []
  for (const g of groups) {
    const active = g.items.find((i) => i.active)
    const inactive = g.items.filter((i) => !i.active)
    if (!active || inactive.length === 0) continue
    const twin = inactive.find((i) => !stylesDistinct(active.style, i.style, t))
    if (twin) out.push({ name: g.name, active: active.label, twin: twin.label })
  }
  return out
}

/** attribution: null | { label, style:{fontSize,color,textDecorationLine}, rect:{w,h} } */
export function evaluateAttribution(attribution, t = THRESHOLDS) {
  if (!attribution) return []
  const issues = []
  const size = parseFloat(attribution.style.fontSize)
  if (size < t.attributionMinFontPx || attribution.rect.h < t.attributionMinHeightPx) {
    issues.push(`too small (${size}px text, ${Math.round(attribution.rect.h)}px tall)`)
  }
  if (
    DEFAULT_LINK_COLORS.includes(attribution.style.color) &&
    attribution.style.textDecorationLine.includes('underline')
  ) {
    issues.push('browser-default link styling (default link color + underline)')
  }
  return issues
}

/** Turn a snapshot into the WARN lines for one step. */
export function warningsForSnapshot(step, snapshot, t = THRESHOLDS) {
  const lines = []
  for (const o of evaluateOverlaps(snapshot.elements, t)) {
    lines.push(
      `WARN step ${step}: overlap between ${o.a} and ${o.b}; fix the layout or wrap an intentional overlap in [data-presentation-allow-overlap]`,
    )
  }
  for (const c of evaluateActiveChrome(snapshot.chromeGroups, t)) {
    lines.push(
      `WARN step ${step}: active ${c.name} item ${c.active} looks the same as inactive ${c.twin}; style [data-presentation-active="true"]`,
    )
  }
  for (const issue of evaluateAttribution(snapshot.attribution, t)) {
    lines.push(
      `WARN step ${step}: attribution link is ${issue}; style the [data-presentation-attribution] hook in your presentation CSS`,
    )
  }
  return lines
}

/** Runs inside the page. Must stay self-contained (no closures over module scope). */
export function collectSnapshot() {
  const STYLE_KEYS = [
    'backgroundColor', 'color', 'borderTopColor', 'borderLeftColor', 'outlineColor', 'width', 'height',
    'fontWeight', 'opacity', 'boxShadow', 'textDecorationLine', 'transform', 'borderTopWidth', 'borderLeftWidth',
  ]
  const styleOf = (el) => {
    const cs = getComputedStyle(el)
    const out = {}
    for (const k of STYLE_KEYS) out[k] = cs[k]
    out.fontSize = cs.fontSize
    return out
  }
  const visible = (el) => {
    let opacity = 1
    for (let n = el; n && n !== document.documentElement; n = n.parentElement) {
      const cs = getComputedStyle(n)
      if (cs.display === 'none' || cs.visibility === 'hidden') return false
      opacity *= Number(cs.opacity)
    }
    return opacity > 0.05
  }
  const describe = (el) => {
    const hook = el.getAttributeNames().find((a) => a.startsWith('data-presentation-') && a !== 'data-presentation-active')
    const text = (el.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 40)
    return `<${el.tagName.toLowerCase()}${hook ? ` ${hook}` : ''}>${text ? ` "${text}"` : ''}`
  }
  const rectOf = (r) => ({ x: r.left, y: r.top, w: r.width, h: r.height })

  const found = new Map()
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (!node.nodeValue.trim() || !node.parentElement) continue
    if (['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(node.parentElement.tagName)) continue
    const range = document.createRange()
    range.selectNodeContents(node)
    const r = range.getBoundingClientRect()
    if (r.width <= 0 || r.height <= 0) continue
    const el = node.parentElement
    const prev = found.get(el)
    if (!prev) found.set(el, r)
    else {
      const l = Math.min(prev.left, r.left), t = Math.min(prev.top, r.top)
      found.set(el, new DOMRect(l, t, Math.max(prev.right, r.right) - l, Math.max(prev.bottom, r.bottom) - t))
    }
  }
  // Text-less chrome (e.g. progress dots) participates by its box.
  for (const el of document.querySelectorAll('[data-presentation-progress-item], [data-presentation-toc-item]')) {
    if (!found.has(el)) found.set(el, el.getBoundingClientRect())
  }
  const entries = [...found.entries()].filter(([el]) => visible(el))
  const elements = entries.map(([el, r], uid) => ({
    uid, el, label: describe(el), rect: rectOf(r), allowed: !!el.closest('[data-presentation-allow-overlap]'),
  }))
  for (const e of elements) {
    e.ancestors = elements.filter((o) => o !== e && o.el.contains(e.el)).map((o) => o.uid)
  }
  const chromeGroups = []
  for (const [name, sel] of [['progress', '[data-presentation-progress-item]'], ['table-of-contents', '[data-presentation-toc-item]']]) {
    const items = [...document.querySelectorAll(sel)].filter(visible)
    if (items.length) {
      chromeGroups.push({
        name,
        items: items.map((el) => ({
          label: describe(el) + (el.getAttribute('aria-label') ? ` (${el.getAttribute('aria-label')})` : ''),
          active: el.getAttribute('data-presentation-active') === 'true',
          style: styleOf(el),
        })),
      })
    }
  }
  const a = document.querySelector('[data-presentation-attribution]')
  const attribution = a && visible(a)
    ? { label: describe(a), style: styleOf(a), rect: rectOf(a.getBoundingClientRect()) }
    : null
  return {
    elements: elements.map(({ el: _el, ...rest }) => rest),
    chromeGroups,
    attribution,
  }
}
