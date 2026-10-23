// Runs inside the page (serialized by Playwright): must stay self-contained.
export function snapshotPage() {
  const STYLE_KEYS = [
    'color', 'backgroundColor', 'borderTopColor', 'borderTopWidth', 'opacity', 'fontWeight',
    'textDecorationLine', 'boxShadow', 'outlineStyle', 'transform',
  ]
  const styleOf = (el) => {
    const cs = getComputedStyle(el)
    return Object.fromEntries(STYLE_KEYS.map((k) => [k, cs[k]]))
  }
  const CHROME = 'button, a[href], [data-presentation-progress-item]'
  const visible = (el) => {
    const r = el.getBoundingClientRect()
    return r.width > 0 && r.height > 0 && el.checkVisibility({ opacityProperty: true, visibilityProperty: true })
  }
  const textRect = (el) => {
    const range = document.createRange()
    let union = null
    for (const node of el.childNodes) {
      if (node.nodeType !== Node.TEXT_NODE || !node.textContent.trim()) continue
      range.selectNodeContents(node)
      const r = range.getBoundingClientRect()
      if (r.width === 0 || r.height === 0) continue
      union = union
        ? { l: Math.min(union.l, r.left), t: Math.min(union.t, r.top), r: Math.max(union.r, r.right), b: Math.max(union.b, r.bottom) }
        : { l: r.left, t: r.top, r: r.right, b: r.bottom }
    }
    return union && { x: union.l, y: union.t, w: union.r - union.l, h: union.b - union.t }
  }
  const describe = (el) => {
    const owner = el.closest('[data-presentation-entity]')
    const hook = [...el.attributes].find((a) => a.name.startsWith('data-presentation-') && a.name !== 'data-presentation-active')
    const label = (el.textContent || '').trim().slice(0, 24)
    return `<${el.tagName.toLowerCase()}${hook ? ` ${hook.name}` : ''}>${owner && owner !== el ? ` in [${owner.getAttribute('data-presentation-entity')}]` : ''} "${label}"`
  }

  const els = [...document.body.querySelectorAll('*')].filter((el) => !['SCRIPT', 'STYLE', 'defs', 'marker'].includes(el.tagName))
  const items = []
  const index = new Map()
  for (const el of els) {
    if (!visible(el)) continue
    const chrome = el.matches(CHROME)
    const r = chrome ? el.getBoundingClientRect() : textRect(el)
    if (!r) continue
    const rect = chrome ? { x: r.x, y: r.y, w: r.width, h: r.height } : r
    index.set(el, items.length)
    items.push({ el, rect, chrome })
  }
  const overlapItems = items.map(({ el, rect, chrome }) => {
    const ancestors = []
    for (let p = el.parentElement; p; p = p.parentElement) if (index.has(p)) ancestors.push(index.get(p))
    return { label: describe(el), rect, chrome, allowed: el.closest('[data-presentation-allow-overlap]') !== null, ancestors }
  })

  const pair = (container) => {
    const entries = [...document.querySelectorAll(container)].filter(visible)
    const active = entries.find((e) => e.getAttribute('data-presentation-active') === 'true')
    const inactive = entries.find((e) => e.getAttribute('data-presentation-active') !== 'true')
    return active && inactive ? { active: styleOf(active), inactive: styleOf(inactive) } : null
  }
  const attr = document.querySelector('[data-presentation-attribution]')
  const attrStyle = attr && getComputedStyle(attr)
  return {
    overlapItems,
    progress: pair('[data-presentation-progress-item]'),
    toc: pair('[data-presentation-toc-entry]'),
    attribution: attr && {
      fontSize: parseFloat(attrStyle.fontSize),
      color: attrStyle.color,
      textDecorationLine: attrStyle.textDecorationLine,
    },
  }
}
