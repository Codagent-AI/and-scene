// Runs in the page: keep this function self-contained for Playwright serialization.
export function collectVisuals() {
  const visible = el => {
    const r = el.getBoundingClientRect()
    if (r.width <= 0 || r.height <= 0) return false
    for (let ancestor = el; ancestor; ancestor = ancestor.parentElement) {
      const style = getComputedStyle(ancestor)
      if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity || 1) === 0) return false
    }
    return true
  }
  const identify = el => el.getAttribute('data-presentation-entity') || el.getAttribute('aria-label') || el.textContent.trim().slice(0, 60) || el.tagName
  const text = [...document.querySelectorAll('[data-presentation] *')].filter(el => visible(el) && !el.closest('[data-presentation-allow-overlap]'))
  const boxes = text.flatMap(el => [...el.childNodes].filter(node => node.nodeType === Node.TEXT_NODE && node.textContent.trim()).flatMap(node => {
    const range = document.createRange()
    range.selectNodeContents(node)
    return [...range.getClientRects()].map(r => ({ id: identify(el), left: r.left, top: r.top, right: r.right, bottom: r.bottom }))
  }))
  const signature = el => {
    const s = getComputedStyle(el)
    return [s.color, s.backgroundColor, s.borderColor, s.borderWidth, s.fontWeight, s.textDecoration, s.boxShadow, s.opacity, s.transform].join('|')
  }
  const chrome = ['progress', 'toc'].map(kind => {
    const entries = [...document.querySelectorAll(`[data-presentation-${kind}-entry]`)].filter(visible)
    const active = entries.find(el => el.getAttribute('data-presentation-active') === 'true')
    return { kind, active: active && signature(active), inactive: entries.filter(el => el !== active).map(signature) }
  })
  const attr = document.querySelector('[data-presentation-attribution] a')
  const s = attr && getComputedStyle(attr)
  return { boxes, chrome, attribution: s && visible(attr) ? { size: parseFloat(s.fontSize), color: s.color, decoration: s.textDecorationLine } : null }
}
export function diagnose({ boxes, chrome, attribution }) {
  const warnings = []
  for (let a = 0; a < boxes.length; a++) for (let b = a + 1; b < boxes.length; b++) {
    const x = boxes[a], y = boxes[b]
    if (Math.min(x.right, y.right) - Math.max(x.left, y.left) > 2 && Math.min(x.bottom, y.bottom) - Math.max(x.top, y.top) > 2) warnings.push(`overlap: ${x.id} / ${y.id}`)
  }
  for (const entry of chrome) if (entry.active && entry.inactive.includes(entry.active)) warnings.push(`indistinct active ${entry.kind} chrome`)
  if (!attribution || attribution.size < 11 || (['rgb(0, 0, 238)', 'rgb(85, 26, 139)'].includes(attribution.color) && attribution.decoration.includes('underline'))) warnings.push('unpolished attribution: style [data-presentation-attribution] a')
  return warnings
}
