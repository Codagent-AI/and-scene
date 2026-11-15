// Runs in the browser via page.evaluate. Keep this function self-contained.
export function diagnose() {
  const warnings = []
  function visible(el) {
    for (let parent = el; parent; parent = parent.parentElement) {
      const style = getComputedStyle(parent)
      if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) return false
    }
    return !!el.getClientRects().length
  }
  const name = el => el.getAttribute('data-presentation-node') || el.getAttribute('aria-label') || el.textContent.trim().slice(0, 65)
  const walker = document.createTreeWalker(document.querySelector('[data-presentation]'), NodeFilter.SHOW_TEXT)
  const text = []
  while (walker.nextNode()) {
    const node = walker.currentNode
    const el = node.parentElement
    if (!node.textContent.trim() || !visible(el) || el.closest('[data-presentation-allow-overlap]') || el.closest('svg,script,style')) continue
    const range = document.createRange()
    range.selectNodeContents(node)
    for (const rect of range.getClientRects()) if (rect.width && rect.height) text.push({ el, rect })
  }
  for (let i = 0; i < text.length; i++) for (let j = i + 1; j < text.length; j++) {
    const a = text[i], b = text[j]
    if (a.el === b.el) continue
    if (Math.min(a.rect.right, b.rect.right) - Math.max(a.rect.left, b.rect.left) > 2 && Math.min(a.rect.bottom, b.rect.bottom) - Math.max(a.rect.top, b.rect.top) > 2) warnings.push(`overlap: ${name(a.el)} / ${name(b.el)}`)
  }
  // Include empty chrome surfaces (e.g. progress dots), not just their text.
  for (const control of document.querySelectorAll('[data-presentation-controls] button,[data-presentation-toc-entry],[data-presentation-mode-toggle]')) {
    if (!visible(control) || control.closest('[data-presentation-allow-overlap]')) continue
    const r = control.getBoundingClientRect()
    for (const t of text) if (!control.contains(t.el) && t.el.closest('[data-presentation-canvas]') && Math.min(r.right, t.rect.right) - Math.max(r.left, t.rect.left) > 2 && Math.min(r.bottom, t.rect.bottom) - Math.max(r.top, t.rect.top) > 2) warnings.push(`overlap: ${name(control)} / ${name(t.el)}`)
  }
  for (const hook of ['data-presentation-progress-step', 'data-presentation-toc-entry']) {
    const active = document.querySelector(`[${hook}][data-presentation-active="true"]`)
    const inactive = document.querySelector(`[${hook}][data-presentation-active="false"]`)
    if (active && inactive && visible(active)) {
      const signature = el => { const s = getComputedStyle(el); return [s.color, s.backgroundColor, s.borderColor, s.borderWidth, s.fontWeight, s.opacity, s.boxShadow, s.textDecorationLine].join('|') }
      if (signature(active) === signature(inactive)) warnings.push(`indistinct active chrome: ${hook}`)
    }
  }
  const attribution = document.querySelector('[data-presentation-attribution]')
  if (!attribution || !visible(attribution)) warnings.push('missing attribution: style [data-presentation-attribution]')
  else {
    const s = getComputedStyle(attribution)
    if (parseFloat(s.fontSize) < 12 || /Times New Roman/.test(s.fontFamily) || ['rgb(0, 0, 238)', 'rgb(85, 26, 139)'].includes(s.color)) warnings.push('unpolished attribution: style [data-presentation-attribution]')
  }
  return [...new Set(warnings)]
}
