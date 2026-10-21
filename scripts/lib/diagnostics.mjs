/**
 * Advisory visual diagnostics for the screenshot helper. `collectSnapshot` runs
 * inside the page and returns plain data; the analysis functions below take that
 * data, so they can be unit tested without a browser.
 */

export const MIN_ATTRIBUTION_FONT_PX = 11
export const ACTIVE_STYLE_PROPS = [
  'color', 'backgroundColor', 'borderTopColor', 'borderTopWidth', 'borderTopStyle',
  'outlineColor', 'outlineWidth', 'outlineStyle', 'boxShadow', 'opacity', 'fontWeight',
  'textDecorationLine', 'width', 'height',
]

/** Self-contained: serialized into the page by Playwright, so it may not use imports. */
export function collectSnapshot(activeProps) {
  const chromeSelector = [
    '[data-presentation-progress-item]', '[data-presentation-prev]', '[data-presentation-next]',
    '[data-presentation-toc-entry]', '[data-presentation-attribution]',
  ].join(',')
  const ids = new Map()
  const idOf = (el) => {
    if (!ids.has(el)) ids.set(el, ids.size)
    return ids.get(el)
  }
  const describe = (el) => {
    const attr = [...el.attributes].find((a) => a.name.startsWith('data-presentation-') && a.name !== 'data-presentation-active')
    const hook = attr ? `[${attr.name}${attr.value ? `="${attr.value}"` : ''}]` : ''
    const text = (el.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 30)
    return `${el.tagName.toLowerCase()}${hook}${text ? ` "${text}"` : ''}`
  }
  const visible = (el) => el.checkVisibility({ opacityProperty: true, visibilityProperty: true })
  const hasOwnText = (el) => [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())
  const textRect = (el) => {
    const range = document.createRange()
    range.selectNodeContents(el)
    return range.getBoundingClientRect()
  }
  const toRect = (r) => ({ x: r.left, y: r.top, w: r.width, h: r.height })

  const elements = []
  for (const el of document.body.querySelectorAll('*')) {
    const chrome = el.matches(chromeSelector)
    if (!chrome && !hasOwnText(el)) continue
    if (!visible(el)) continue
    const rect = toRect(chrome ? el.getBoundingClientRect() : textRect(el))
    if (rect.w <= 0 || rect.h <= 0) continue
    const ancestors = []
    const allow = []
    for (let n = el; n && n !== document.body; n = n.parentElement) {
      ancestors.push(idOf(n))
      if (n.hasAttribute('data-presentation-allow-overlap')) allow.push(idOf(n))
    }
    elements.push({ label: describe(el), rect, id: idOf(el), ancestors, allow })
  }

  const style = (el) => {
    const computed = getComputedStyle(el)
    return Object.fromEntries(activeProps.map((p) => [p, computed[p]]))
  }
  const active = []
  for (const [group, selector] of [
    ['progress', '[data-presentation-progress-item]'],
    ['table of contents', '[data-presentation-toc-entry]'],
  ]) {
    const items = [...document.querySelectorAll(selector)].filter(visible)
    const on = items.find((el) => el.hasAttribute('data-presentation-active'))
    const off = items.find((el) => !el.hasAttribute('data-presentation-active'))
    if (on && off) active.push({ group, active: style(on), inactive: style(off) })
  }

  const link = document.querySelector('[data-presentation-attribution]')
  let attribution = null
  if (link) {
    const probe = document.body.appendChild(document.createElement('a'))
    probe.href = '#'
    const base = getComputedStyle(probe)
    const own = getComputedStyle(link)
    attribution = {
      fontSize: parseFloat(own.fontSize),
      color: own.color,
      textDecorationLine: own.textDecorationLine,
      defaultColor: base.color,
    }
    probe.remove()
  }
  return { elements, active, attribution }
}

export function intersects(a, b, tolerance = 1) {
  return (
    Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x) > tolerance &&
    Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y) > tolerance
  )
}

/** Overlapping visible text/chrome pairs, excluding ancestors and a shared allow-overlap subtree. */
export function findOverlaps(elements) {
  const pairs = []
  for (let i = 0; i < elements.length; i++) {
    for (let j = i + 1; j < elements.length; j++) {
      const a = elements[i]
      const b = elements[j]
      if (a.ancestors.includes(b.id) || b.ancestors.includes(a.id)) continue
      if (a.allow.some((id) => b.allow.includes(id))) continue
      if (intersects(a.rect, b.rect)) pairs.push([a.label, b.label])
    }
  }
  return pairs
}

export function isIndistinct(active, inactive, props = ACTIVE_STYLE_PROPS) {
  return props.every((p) => active[p] === inactive[p])
}

/** Returns a short problem description, or null when the attribution looks authored. */
export function attributionProblem(attribution) {
  if (!attribution) return 'is missing'
  if (attribution.fontSize < MIN_ATTRIBUTION_FONT_PX) {
    return `is too small (${attribution.fontSize}px, minimum ${MIN_ATTRIBUTION_FONT_PX}px)`
  }
  if (attribution.color === attribution.defaultColor && attribution.textDecorationLine.includes('underline')) {
    return 'uses the browser-default link style'
  }
  return null
}

export function analyzeSnapshot(step, snapshot) {
  const warnings = []
  for (const [a, b] of findOverlaps(snapshot.elements)) {
    warnings.push(`step ${step}: overlap between ${a} and ${b} (mark an intentional one with data-presentation-allow-overlap)`)
  }
  for (const item of snapshot.active) {
    if (isIndistinct(item.active, item.inactive)) {
      warnings.push(`step ${step}: active ${item.group} item looks identical to inactive ones (style [data-presentation-active])`)
    }
  }
  const problem = attributionProblem(snapshot.attribution)
  if (problem) {
    warnings.push(`step ${step}: attribution ${problem} (style [data-presentation-attribution] in presentation CSS)`)
  }
  return warnings
}
