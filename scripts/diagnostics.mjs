// Serializable browser-side diagnostics: warnings assist review, never grade taste.
export function collectDiagnostics() {
  const warnings = []
  const visible = e => { const r = e.getBoundingClientRect(); if (!r.width || !r.height) return false; for (let node = e; node; node = node.parentElement) { const s = getComputedStyle(node); if (s.display === 'none' || s.visibility === 'hidden' || s.opacity === '0') return false } return true }
  const allowed = e => e.closest('[data-presentation-allow-overlap]') !== null
  const describe = e => (e.closest('[data-presentation-entity]')?.getAttribute('data-presentation-entity') ?? e.getAttribute('aria-label') ?? e.tagName.toLowerCase()) + ':' + e.textContent.trim().slice(0, 45)
  const rectangles = []
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
  while (walker.nextNode()) {
    const text = walker.currentNode, e = text.parentElement
    if (!text.textContent.trim() || !e || e.closest('script,style') || !visible(e) || allowed(e)) continue
    const range = document.createRange(); range.selectNodeContents(text)
    for (const rect of range.getClientRects()) if (rect.width && rect.height) rectangles.push({ e, rect, kind: 'text' })
  }
  for (const e of document.querySelectorAll('[data-presentation-header],[data-presentation-footer],[data-presentation-toc],[data-presentation-attribution]')) {
    if (visible(e) && !allowed(e)) rectangles.push({ e, rect: e.getBoundingClientRect(), kind: 'chrome' })
  }
  const seen = new Set()
  for (let i = 0; i < rectangles.length; i++) for (let j = i + 1; j < rectangles.length; j++) {
    const a = rectangles[i], b = rectangles[j]
    // A chrome rectangle contains its own text by design. Distinct text ranges
    // still need comparison, including parent text overlapping positioned children.
    if ((a.kind === 'chrome' && a.e.contains(b.e)) || (b.kind === 'chrome' && b.e.contains(a.e))) continue
    const x = Math.min(a.rect.right,b.rect.right)-Math.max(a.rect.left,b.rect.left), y = Math.min(a.rect.bottom,b.rect.bottom)-Math.max(a.rect.top,b.rect.top)
    if (x > 1 && y > 1) {
      const message = `overlap ${describe(a.e)} / ${describe(b.e)}`
      if (!seen.has(message)) { seen.add(message); warnings.push(message) }
    }
  }
  const fingerprint = e => { const s = getComputedStyle(e); return [s.color,s.backgroundColor,s.fontWeight,s.borderColor,s.borderWidth,s.boxShadow,s.textDecoration,s.outlineStyle].join('|') }
  for (const hook of ['progress-entry','toc-entry']) {
    const controls = [...document.querySelectorAll(`[data-presentation-${hook}]`)].filter(visible)
    const active = controls.find(e => e.getAttribute('data-presentation-active') === 'true')
    if (active && controls.some(e => e !== active && fingerprint(e) === fingerprint(active))) warnings.push(`indistinct active ${hook}`)
  }
  const attribution = document.querySelector('[data-presentation-attribution] a')
  if (!attribution || !visible(attribution)) warnings.push('missing attribution: style [data-presentation-attribution]')
  else {
    const style = getComputedStyle(attribution)
    const tiny = parseFloat(style.fontSize) < 11
    const defaults = ['rgb(0, 0, 238)','rgb(85, 26, 139)'].includes(style.color) || (style.fontFamily.includes('Times New Roman') && style.textDecorationLine.includes('underline'))
    if (tiny || defaults) warnings.push('unpolished attribution: style [data-presentation-attribution]')
  }
  return warnings
}
