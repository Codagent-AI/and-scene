// Serialized into the browser: keep this function self-contained.
export function collectDiagnostics() {
  const root = document.querySelector('[data-presentation-root]')
  const visible = el => {
    for (let node = el; node; node = node.parentElement) {
      const s = getComputedStyle(node)
      if (s.display === 'none' || s.visibility === 'hidden' || Number(s.opacity) === 0) return false
    }
    return el.getBoundingClientRect().width > 0
  }
  const describe = el => el.getAttribute('aria-label') || el.getAttribute('data-presentation-entity') || el.getAttribute('data-sample-entity') || el.textContent.trim().slice(0, 60) || el.tagName
  const controlSelector = 'button,[data-presentation-attribution]'
  const texts = [...root.querySelectorAll(controlSelector)].filter(el => visible(el) && !el.closest('[data-presentation-allow-overlap="true"]')).map(el => {
    const r = el.getBoundingClientRect()
    return { label: describe(el), rect: { x: r.x, y: r.y, width: r.width, height: r.height } }
  })
  // Range rectangles include font line-box slack, not just painted glyphs.
  // Keep the measurement here so this browser-serialized function is self-contained.
  let context
  const glyphMetrics = (el, text) => {
    const style = getComputedStyle(el)
    if (el.namespaceURI !== 'http://www.w3.org/1999/xhtml' || (style.writingMode && style.writingMode !== 'horizontal-tb')) return
    for (let ancestor = el; ancestor; ancestor = ancestor.parentElement) {
      const transform = getComputedStyle(ancestor).transform
      if (!transform || transform === 'none') continue
      if (typeof DOMMatrixReadOnly === 'undefined') return
      const matrix = new DOMMatrixReadOnly(transform)
      if (!matrix.is2D || matrix.b !== 0 || matrix.c !== 0 || matrix.a <= 0 || matrix.d <= 0) return
    }
    if (context === undefined) context = document.createElement('canvas').getContext('2d')
    if (!context) return
    context.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`
    if (style.textTransform === 'uppercase') text = text.toLocaleUpperCase()
    if (style.textTransform === 'lowercase') text = text.toLocaleLowerCase()
    const m = context.measureText(text)
    const ink = { fontAscent: m.fontBoundingBoxAscent, fontDescent: m.fontBoundingBoxDescent, ascent: m.actualBoundingBoxAscent, descent: m.actualBoundingBoxDescent }
    if (Object.values(ink).every(Number.isFinite) && ink.fontAscent + ink.fontDescent > 0 && ink.ascent + ink.descent > 0) return ink
  }
  const legibility = [], measured = new Set()
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  while (walker.nextNode()) {
    const node = walker.currentNode, el = node.parentElement
    if (!node.textContent.trim() || !visible(el)) continue
    const canvas = el.closest('[data-presentation-canvas]')
    if (canvas && !measured.has(el)) {
      measured.add(el)
      const scale = canvas.offsetWidth ? canvas.getBoundingClientRect().width / canvas.offsetWidth : 1
      legibility.push({ label: describe(el), fontSize: parseFloat(getComputedStyle(el).fontSize) * scale })
    }
    if (el.closest(controlSelector) || el.closest('[data-presentation-allow-overlap="true"]')) continue
    const range = document.createRange(); range.selectNodeContents(node)
    const ink = glyphMetrics(el, node.textContent)
    for (const rect of range.getClientRects()) if (rect.width && rect.height) texts.push({ label: describe(el), rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height }, ...(ink ? { ink } : {}) })
  }
  const signature = el => {
    const s = getComputedStyle(el)
    return [s.color, s.backgroundColor, s.fontWeight, s.borderColor, s.borderWidth, s.boxShadow, s.opacity, s.textDecorationLine, s.transform].join('|')
  }
  const chrome = ['progress', 'toc'].flatMap(kind => {
    const items = [...root.querySelectorAll(`[data-presentation-${kind}-entry]`)].filter(visible)
    const active = items.find(el => el.dataset.presentationActive === 'true')
    const inactive = items.filter(el => el !== active)
    return active && inactive.length ? [{ kind, active: signature(active), inactive: inactive.map(signature) }] : []
  })
  const link = root.querySelector('[data-presentation-attribution]')
  const s = link && getComputedStyle(link)
  return { texts, chrome, legibility, attribution: link && visible(link) ? { fontSize: parseFloat(s.fontSize), color: s.color, fontFamily: s.fontFamily, text: link.textContent, href: link.getAttribute('href') } : null }
}
export function textInkBounds(text) {
  const { rect, ink } = text
  if (!ink || ![ink.fontAscent, ink.fontDescent, ink.ascent, ink.descent].every(Number.isFinite)) return rect
  const fontHeight = ink.fontAscent + ink.fontDescent, inkHeight = ink.ascent + ink.descent
  if (fontHeight <= 0 || inkHeight <= 0) return rect
  const scale = rect.height / fontHeight
  return { ...rect, y: rect.y + (ink.fontAscent - ink.ascent) * scale, height: inkHeight * scale }
}
export function warningsFor(data, step) {
  const warnings = []
  for (let i = 0; i < data.texts.length; i++) for (let j = i + 1; j < data.texts.length; j++) {
    const a = data.texts[i], b = data.texts[j], r = textInkBounds(a), s = textInkBounds(b)
    if (Math.min(r.x + r.width, s.x + s.width) - Math.max(r.x, s.x) > 1 && Math.min(r.y + r.height, s.y + s.height) - Math.max(r.y, s.y) > 1)
      warnings.push(`step ${step}: overlap "${a.label}" / "${b.label}"`)
  }
  for (const text of data.legibility ?? []) if (text.fontSize < 12) warnings.push(`step ${step}: small diagram text "${text.label}" (${text.fontSize.toFixed(1)}px rendered); enlarge presentation-owned type or adjust composition`)
  for (const c of data.chrome) if (c.inactive.some(s => s === c.active)) warnings.push(`step ${step}: indistinct active ${c.kind} chrome`)
  const a = data.attribution
  if (!a || a.fontSize < 12 || ['rgb(0, 0, 238)', 'rgb(85, 26, 139)'].includes(a.color) || /Times New Roman|^serif$/i.test(a.fontFamily)) warnings.push(`step ${step}: unpolished attribution; style [data-presentation-attribution]`)
  return warnings
}
