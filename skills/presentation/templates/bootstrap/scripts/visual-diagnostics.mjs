// Serializable browser-side diagnostic: no screenshot interpretation or quality verdict.
export function visualDiagnostics() {
  const warnings = []
  const visible = el => {
    const s = getComputedStyle(el), r = el.getBoundingClientRect()
    for (let parent = el.parentElement; parent; parent = parent.parentElement) {
      const p = getComputedStyle(parent)
      if (p.display === 'none' || p.visibility === 'hidden' || Number(p.opacity) === 0) return false
    }
    return s.display !== 'none' && s.visibility !== 'hidden' && Number(s.opacity) > 0 && r.width > 0 && r.height > 0
  }
  const label = el => el.getAttribute('data-presentation-entity') || el.getAttribute('aria-label') || el.textContent.trim().slice(0, 50) || el.tagName
  const allowed = el => !!el.closest('[data-presentation-allow-overlap]')
  // Text ranges avoid treating a large enclosing frame as text occupying its entire box.
  const texts = []
  const walker = document.createTreeWalker(document.querySelector('[data-presentation-root]') ?? document.body, NodeFilter.SHOW_TEXT)
  while (walker.nextNode()) {
    const node = walker.currentNode, el = node.parentElement
    if (!node.textContent.trim() || !el || !visible(el) || allowed(el) || el.closest('script,style')) continue
    const range = document.createRange(); range.selectNodeContents(node)
    for (const rect of range.getClientRects()) if (rect.width > 0 && rect.height > 0) texts.push({ el, rect })
  }
  for (let i = 0; i < texts.length; i++) for (let j = i + 1; j < texts.length; j++) {
    const a = texts[i], b = texts[j]
    if (a.el === b.el) continue
    if (Math.min(a.rect.right, b.rect.right) - Math.max(a.rect.left, b.rect.left) > 2 && Math.min(a.rect.bottom, b.rect.bottom) - Math.max(a.rect.top, b.rect.top) > 2) warnings.push(`overlap: ${label(a.el)} / ${label(b.el)}`)
  }
  const controls = [...document.querySelectorAll('button,[data-presentation-attribution]')].filter(el => visible(el) && !allowed(el))
  for (const text of texts) for (const control of controls) {
    if (control.contains(text.el) || text.el.contains(control)) continue
    const a = text.rect, b = control.getBoundingClientRect()
    if (Math.min(a.right, b.right) - Math.max(a.left, b.left) > 2 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 2) warnings.push(`overlap: ${label(text.el)} / ${label(control)}`)
  }
  const signature = el => {
    const s = getComputedStyle(el)
    return [s.color, s.backgroundColor, s.borderColor, s.borderWidth, s.fontWeight, s.textDecorationLine, s.boxShadow, s.outline, s.opacity, s.transform].join('|')
  }
  for (const hook of ['progress-entry', 'toc-entry']) {
    const controls = [...document.querySelectorAll(`[data-presentation-${hook}]`)].filter(visible)
    const active = controls.find(el => el.getAttribute('data-presentation-active') === 'true')
    if (active && controls.some(el => el !== active && signature(el) === signature(active))) warnings.push(`indistinct active chrome: ${hook} ${label(active)}`)
  }
  const attribution = document.querySelector('[data-presentation-attribution]')
  if (!attribution || !visible(attribution)) warnings.push('missing attribution: style [data-presentation-attribution]')
  else {
    const s = getComputedStyle(attribution)
    if (parseFloat(s.fontSize) < 11 || (s.textDecorationLine.includes('underline') && ['rgb(0, 0, 238)', 'rgb(85, 26, 139)'].includes(s.color))) warnings.push('unpolished attribution: style [data-presentation-attribution]')
  }
  return [...new Set(warnings)]
}
