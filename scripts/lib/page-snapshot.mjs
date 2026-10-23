/**
 * Runs inside the page (serialized by Playwright), so it must be self-contained.
 * Collects the visible text/chrome boxes and the style snapshots the pure
 * diagnostics compare.
 */
export function snapshotPage() {
  const CHROME =
    '[data-presentation-dot],[data-presentation-toc-entry],[data-presentation-prev],[data-presentation-next],[data-presentation-attribution],[data-presentation-marker]'
  const visible = (el) => {
    const s = getComputedStyle(el)
    return s.display !== 'none' && s.visibility !== 'hidden' && Number(s.opacity) > 0.01
  }
  const label = (el) => {
    const hook = [...el.attributes].find((a) => a.name.startsWith('data-role') || a.name.startsWith('data-presentation-'))
    const text = (el.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 30)
    return `<${el.tagName.toLowerCase()}${hook ? ` ${hook.name}${hook.value ? `="${hook.value}"` : ''}` : ''}>${text ? ` "${text}"` : ''}`
  }
  const ownTextRect = (el) => {
    const range = document.createRange()
    let box = null
    for (const node of el.childNodes) {
      if (node.nodeType !== Node.TEXT_NODE || !node.textContent.trim()) continue
      range.selectNodeContents(node)
      for (const r of range.getClientRects()) {
        if (r.width === 0 || r.height === 0) continue
        box = box
          ? { x1: Math.min(box.x1, r.left), y1: Math.min(box.y1, r.top), x2: Math.max(box.x2, r.right), y2: Math.max(box.y2, r.bottom) }
          : { x1: r.left, y1: r.top, x2: r.right, y2: r.bottom }
      }
    }
    return box && { x: box.x1, y: box.y1, w: box.x2 - box.x1, h: box.y2 - box.y1 }
  }
  const candidates = new Map()
  for (const el of document.body.querySelectorAll('*')) {
    if (!visible(el)) continue
    const rect = ownTextRect(el)
    if (rect) candidates.set(el, rect)
  }
  for (const el of document.querySelectorAll(CHROME)) {
    if (!visible(el) || candidates.has(el)) continue
    const r = el.getBoundingClientRect()
    if (r.width > 0 && r.height > 0) candidates.set(el, { x: r.left, y: r.top, w: r.width, h: r.height })
  }
  // An element that paints a background or border also hides whatever lies under its box,
  // even where its own text does not reach.
  const paintsBox = (el) => {
    const s = getComputedStyle(el)
    const bg = /^rgba?\(([^)]*)\)$/.exec(s.backgroundColor)
    const alpha = bg ? (bg[1].split(/[,/]/).length > 3 ? Number(bg[1].split(/[,/]/)[3]) : 1) : 0
    return alpha > 0.05 || (parseFloat(s.borderTopWidth) > 0 && s.borderTopStyle !== 'none')
  }
  const entries = [...candidates]
  const items = entries.map(([el, rect], index) => {
    const box = el.getBoundingClientRect()
    return {
      id: label(el),
      index,
      rect,
      cover: paintsBox(el) && box.width > 0 && box.height > 0 ? { x: box.left, y: box.top, w: box.width, h: box.height } : null,
      within: entries.flatMap(([other], i) => (other !== el && other.contains(el) ? [i] : [])),
      allowed: el.closest('[data-presentation-allow-overlap]') !== null,
    }
  })

  // Text entries size to their label, so their box size says nothing about styling.
  const style = (el, includeSize) => {
    const s = getComputedStyle(el)
    return {
      color: s.color,
      backgroundColor: s.backgroundColor,
      borderColor: s.borderTopColor,
      borderWidth: s.borderTopWidth,
      opacity: s.opacity,
      width: includeSize ? s.width : '',
      height: includeSize ? s.height : '',
      fontWeight: s.fontWeight,
    }
  }
  const chromeKinds = [
    ['progress indicator', '[data-presentation-dot]', true],
    ['table-of-contents entry', '[data-presentation-toc-entry]', false],
  ]
  const chrome = chromeKinds.map(([name, selector, includeSize]) => {
    const all = [...document.querySelectorAll(selector)]
    const active = all.find((e) => e.getAttribute('data-presentation-active') === 'true')
    const inactive = all.find((e) => e !== active)
    return { name, active: active ? style(active, includeSize) : null, inactive: inactive ? style(inactive, includeSize) : null }
  })
  const a = document.querySelector('[data-presentation-attribution]')
  const attribution = a
    ? (() => {
        const s = getComputedStyle(a)
        return { fontSizePx: parseFloat(s.fontSize), color: s.color, textDecoration: s.textDecorationLine }
      })()
    : null
  const root = document.querySelector('[data-step-count]')
  return {
    count: root ? Number(root.getAttribute('data-step-count')) : 0,
    items,
    chrome,
    attribution,
  }
}
