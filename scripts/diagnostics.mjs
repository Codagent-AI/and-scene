/* global document, NodeFilter, getComputedStyle, innerWidth, innerHeight */
// Runs inside Chromium; keep this function independent of module-level values.
export function collectSnapshot() {
  const visible = (element) => {
    for (let ancestor = element; ancestor; ancestor = ancestor.parentElement) {
      const style = getComputedStyle(ancestor)
      if (style.visibility === 'hidden' || style.display === 'none' || Number(style.opacity) === 0) return false
    }
    const box = element.getBoundingClientRect()
    return box.width > 0 && box.height > 0
  }
  const label = (element) => element.id || element.getAttribute('aria-label') || element.textContent?.trim().slice(0, 70) || element.tagName
  const texts = []
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
  while (walker.nextNode()) {
    const node = walker.currentNode
    const element = node.parentElement
    if (!element || !node.textContent.trim() || element.closest('script,style,[data-presentation-allow-overlap]') || !visible(element)) continue
    const range = document.createRange()
    range.selectNodeContents(node)
    for (const box of range.getClientRects()) {
      if (box.width > 0 && box.height > 0) texts.push({ name: label(element), x: box.x, y: box.y, width: box.width, height: box.height })
    }
  }
  for (const element of document.querySelectorAll('[data-presentation-progress], [data-presentation-toc-entry], [data-presentation-prev], [data-presentation-next]')) {
    if (element.textContent.trim() || element.closest('[data-presentation-allow-overlap]') || !visible(element)) continue
    const box = element.getBoundingClientRect()
    texts.push({ name: label(element), x: box.x, y: box.y, width: box.width, height: box.height })
  }
  const controls = []
  for (const selector of ['[data-presentation-progress]', '[data-presentation-toc-entry]']) {
    for (const element of document.querySelectorAll(selector)) {
      if (!visible(element)) continue
      const style = getComputedStyle(element)
      controls.push({ group: selector, name: label(element), active: element.getAttribute('aria-current') === 'step' || element.getAttribute('data-active') === 'true', appearance: ['color', 'backgroundColor', 'borderColor', 'borderWidth', 'fontWeight', 'boxShadow', 'opacity', 'transform', 'textDecorationLine', 'outlineStyle'].map((key) => style[key]).join('|') })
    }
  }
  const attribution = document.querySelector('[data-presentation-attribution]')
  let attributionState = null
  if (attribution && visible(attribution)) {
    const style = getComputedStyle(attribution)
    attributionState = { fontSize: parseFloat(style.fontSize), color: style.color, decoration: style.textDecorationLine, fontFamily: style.fontFamily }
  }
  const bounds = (element) => { const box = element.getBoundingClientRect(); return { x: box.x, y: box.y, width: box.width, height: box.height } }
  const canvas = document.querySelector('[data-presentation-canvas]')
  const composition = canvas ? { canvas: bounds(canvas), viewport: { width: innerWidth, height: innerHeight }, entities: [...canvas.querySelectorAll('[data-entity]')].filter(visible).map((element) => ({ name: element.getAttribute('data-entity'), ...bounds(element) })) } : null
  return { texts, controls, attribution: attributionState, composition }
}

export function diagnose(snapshot) {
  const warnings = []
  snapshot.texts.forEach((a, index) => {
    for (const b of snapshot.texts.slice(index + 1)) {
      const width = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x)
      const height = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y)
      if (width > 1 && height > 1) warnings.push(`overlap: ${a.name} / ${b.name}`)
    }
  })
  for (const active of snapshot.controls.filter((control) => control.active)) {
    if (snapshot.controls.some((control) => !control.active && control.group === active.group && control.appearance === active.appearance)) warnings.push(`indistinct active chrome: ${active.group} ${active.name}`)
  }
  const attribution = snapshot.attribution
  if (!attribution) warnings.push('missing attribution: style [data-presentation-attribution]')
  else if (attribution.fontSize < 12 || (['rgb(0, 0, 238)', 'rgb(85, 26, 139)'].includes(attribution.color) && attribution.decoration.includes('underline')) || /Times New Roman/.test(attribution.fontFamily)) warnings.push('unpolished attribution: style [data-presentation-attribution] (minimum 12px; avoid browser-default link treatment)')
  return [...new Set(warnings)]
}
