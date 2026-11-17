// Runs inside the browser. Keep self-contained so Playwright can serialize it.
export function visualDiagnostics() {
  const warnings = []
  const root = document.querySelector('[data-presentation]')
  const label = el => el.getAttribute('data-entity') || el.getAttribute('aria-label') || el.tagName.toLowerCase() + ':' + el.textContent.trim().slice(0, 42)
  const visible = el => {
    const rect = el.getBoundingClientRect()
    for (let parent = el; parent; parent = parent.parentElement) {
      const style = getComputedStyle(parent)
      if (style.visibility === 'hidden' || style.display === 'none' || style.opacity === '0') return false
    }
    return rect.width > 0 && rect.height > 0
  }
  const texts = []
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  while (walker.nextNode()) {
    const node = walker.currentNode
    const el = node.parentElement
    if (!node.textContent.trim() || !visible(el) || el.closest('[data-presentation-allow-overlap]')) continue
    const range = document.createRange()
    range.selectNodeContents(node)
    for (const rect of range.getClientRects()) if (rect.width && rect.height) texts.push({ el, rect })
  }
  // Chrome's occupied control area matters even when its text does not intersect.
  const controls = '[data-presentation-progress-entry],[data-presentation-toc-entry],[data-presentation-prev],[data-presentation-next],[data-presentation-mode-toggle],[data-presentation-attribution]'
  for (const el of root.querySelectorAll(controls)) {
    if (visible(el) && !el.closest('[data-presentation-allow-overlap]')) texts.push({ el, rect: el.getBoundingClientRect() })
  }
  for (let i = 0; i < texts.length; i++) for (let j = i + 1; j < texts.length; j++) {
    const a = texts[i], b = texts[j]
    if (a.el === b.el || a.el.contains(b.el) || b.el.contains(a.el)) continue
    if (Math.min(a.rect.right, b.rect.right) - Math.max(a.rect.left, b.rect.left) > 2 && Math.min(a.rect.bottom, b.rect.bottom) - Math.max(a.rect.top, b.rect.top) > 2) warnings.push(`overlap: ${label(a.el)} / ${label(b.el)}`)
  }
  const signature = el => { const s = getComputedStyle(el); return [s.color, s.backgroundColor, s.borderColor, s.fontWeight, s.opacity, s.boxShadow, s.textDecorationLine].join('|') }
  for (const kind of ['progress', 'toc']) {
    const controls = [...root.querySelectorAll(`[data-presentation-${kind}-entry]`)].filter(visible)
    const active = controls.find(el => el.getAttribute('data-presentation-active') === 'true')
    if (active && controls.some(el => el !== active && signature(el) === signature(active))) warnings.push(`indistinct active ${kind}: data-presentation-${kind}-entry`)
  }
  const attribution = root.querySelector('[data-presentation-attribution]')
  if (!attribution || !visible(attribution)) warnings.push('missing attribution: data-presentation-attribution')
  else {
    const style = getComputedStyle(attribution)
    if (parseFloat(style.fontSize) < 12 || ['rgb(0, 0, 238)', 'rgb(85, 26, 139)'].includes(style.color) || /Times New Roman/.test(style.fontFamily)) warnings.push('unpolished attribution: style data-presentation-attribution')
  }
  return [...new Set(warnings)]
}
