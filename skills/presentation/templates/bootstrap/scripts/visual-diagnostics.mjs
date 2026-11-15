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
  const overlaps = (a, b) => Math.min(a.right, b.right) - Math.max(a.left, b.left) > 2 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 2
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
    if (overlaps(a.rect, b.rect)) warnings.push(`overlap: ${label(a.el)} / ${label(b.el)}`)
  }
  const controls = [...document.querySelectorAll('button,[data-presentation-attribution]')].filter(el => visible(el) && !allowed(el))
  for (const text of texts) for (const control of controls) {
    if (control.contains(text.el) || text.el.contains(control)) continue
    const a = text.rect, b = control.getBoundingClientRect()
    if (overlaps(a, b)) warnings.push(`overlap: ${label(text.el)} / ${label(control)}`)
  }
  for (let i = 0; i < controls.length; i++) for (let j = i + 1; j < controls.length; j++) {
    const a = controls[i], b = controls[j]
    if (a.contains(b) || b.contains(a)) continue
    if (overlaps(a.getBoundingClientRect(), b.getBoundingClientRect())) warnings.push(`overlap: ${label(a)} / ${label(b)}`)
  }
  const paintColor = color => color === 'transparent' || /^rgba\(.*,[\s]*0(?:\.0+)?\)$/.test(color) ? 'transparent' : color
  const signature = el => {
    const s = getComputedStyle(el)
    const stroke = (width, style, color) => parseFloat(width) > 0 && !['none', 'hidden', ''].includes(style) && paintColor(color) !== 'transparent' ? [width, style, color] : null
    const borders = ['Top', 'Right', 'Bottom', 'Left'].map(side => stroke(s[`border${side}Width`], s[`border${side}Style`], s[`border${side}Color`]))
    const outline = stroke(s.outlineWidth, s.outlineStyle, s.outlineColor)
    const decoration = s.textDecorationLine === 'none' || !s.textDecorationLine ? null : [s.textDecorationLine, s.textDecorationColor, s.textDecorationStyle]
    return JSON.stringify([paintColor(s.color), paintColor(s.backgroundColor), borders, s.fontWeight, s.fontSize, decoration, s.boxShadow, outline, s.opacity, s.transform])
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
