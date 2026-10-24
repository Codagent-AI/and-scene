// Runs inside the page (serialised by Playwright), so it must be
// self-contained: no imports and no references to module scope.
export function collectSnapshot() {
  const CHROME_SELECTORS = [
    '[data-presentation-mode-toggle]',
    '[data-presentation-prev]',
    '[data-presentation-next]',
    '[data-presentation-progress-item]',
    '[data-presentation-toc-item]',
    '[data-presentation-attribution]',
  ]
  const STYLE_KEYS = [
    'color',
    'backgroundColor',
    'borderTopColor',
    'borderTopWidth',
    'borderTopStyle',
    'borderRadius',
    'fontWeight',
    'fontSize',
    'opacity',
    'boxShadow',
    'textDecorationLine',
    'transform',
  ]

  function visible(el) {
    for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
      const cs = getComputedStyle(n)
      if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) < 0.05) {
        return false
      }
    }
    return true
  }

  function textRect(el) {
    const range = document.createRange()
    let rect = null
    for (const node of el.childNodes) {
      if (node.nodeType !== 3 || !node.textContent.trim()) continue
      range.selectNodeContents(node)
      const r = range.getBoundingClientRect()
      if (!r.width || !r.height) continue
      rect = rect
        ? {
            x: Math.min(rect.x, r.left),
            y: Math.min(rect.y, r.top),
            r: Math.max(rect.r, r.right),
            b: Math.max(rect.b, r.bottom),
          }
        : { x: r.left, y: r.top, r: r.right, b: r.bottom }
    }
    return rect && { x: rect.x, y: rect.y, w: rect.r - rect.x, h: rect.b - rect.y }
  }

  function describe(el) {
    const id = el.getAttribute('data-presentation-id')
    const hook = el.getAttributeNames().find((a) => a.startsWith('data-presentation-'))
    const text = (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40)
    return `${el.tagName.toLowerCase()}${hook ? `[${hook}${id ? `=${id}` : ''}]` : ''}${text ? ` "${text}"` : ''}`
  }

  const all = [...document.querySelectorAll('body *')]
  const ids = new Map(all.map((el, i) => [el, i]))
  const elements = []
  const seen = new Set()

  function add(el, rect) {
    if (!rect || seen.has(el) || !visible(el)) return
    seen.add(el)
    const ancestors = []
    for (let p = el.parentElement; p; p = p.parentElement) {
      if (ids.has(p)) ancestors.push(ids.get(p))
    }
    elements.push({
      id: ids.get(el),
      label: describe(el),
      rect,
      ancestors,
      allowed: el.closest('[data-presentation-allow-overlap]') !== null,
    })
  }

  for (const el of all) {
    if (el.closest('svg')) continue
    add(el, textRect(el))
  }
  for (const el of document.querySelectorAll(CHROME_SELECTORS.join(','))) {
    const r = el.getBoundingClientRect()
    add(el, { x: r.left, y: r.top, w: r.width, h: r.height })
  }

  function styleOf(el) {
    const cs = getComputedStyle(el)
    const style = Object.fromEntries(STYLE_KEYS.map((k) => [k, cs[k]]))
    // Text items differ in intrinsic size; only compare size for glyph-only items.
    if (!el.textContent.trim()) {
      style.width = cs.width
      style.height = cs.height
    }
    return style
  }
  function group(name, selector) {
    return {
      name,
      items: [...document.querySelectorAll(selector)].map((el) => ({
        active:
          el.getAttribute('aria-current') === 'step' ||
          el.getAttribute('data-presentation-active') === 'true',
        style: styleOf(el),
      })),
    }
  }

  const attr = document.querySelector('[data-presentation-attribution]')
  const attribution = attr
    ? (() => {
        const cs = getComputedStyle(attr)
        return {
          fontSize: parseFloat(cs.fontSize),
          color: cs.color,
          height: attr.getBoundingClientRect().height,
        }
      })()
    : null

  const root = document.querySelector('[data-presentation-root]')
  return {
    stepIndex: root ? Number(root.getAttribute('data-step-index')) : -1,
    elements,
    groups: [
      group('progress indicator', '[data-presentation-progress-item]'),
      group('table of contents', '[data-presentation-toc-item]'),
    ],
    attribution,
  }
}
