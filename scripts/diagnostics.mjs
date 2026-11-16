export function diagnose(elements) {
  const warnings = []
  const text = elements.filter((element) => element.visible && !element.allowOverlap && element.kind === 'text')
  for (let i = 0; i < text.length; i++) for (let j = i + 1; j < text.length; j++) {
    const a = text[i], b = text[j]
    const overlapX = Math.min(a.right, b.right) - Math.max(a.left, b.left)
    const overlapY = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top)
    if (overlapX > 2 && overlapY > 2) warnings.push(`overlap: ${a.name} / ${b.name}`)
  }
  for (const kind of ['progress', 'toc']) {
    const controls = elements.filter((element) => element.visible && element.kind === kind)
    const active = controls.find((element) => element.active)
    if (active && controls.some((element) => !element.active && element.appearance === active.appearance)) warnings.push(`indistinct active ${kind}: ${active.name}`)
  }
  const attribution = elements.find((element) => element.visible && element.kind === 'attribution')
  if (!attribution) warnings.push('missing attribution: style [data-presentation-attribution]')
  else if (attribution.fontSize < 11 || attribution.browserDefault) warnings.push(`unpolished attribution: ${attribution.name}; style [data-presentation-attribution]`)
  return warnings
}

// Serializable browser-side reader; text ranges avoid false positives from nested containers.
export function readDiagnosticElements() {
  const elements = []
  const visible = (element) => {
    for (let ancestor = element; ancestor; ancestor = ancestor.parentElement) {
      const style = getComputedStyle(ancestor)
      if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) return false
    }
    const rect = element.getBoundingClientRect()
    return rect.width > 0 && rect.height > 0
  }
  const name = (element) => element.getAttribute('data-presentation-entity') || element.id || element.getAttribute('aria-label') || element.textContent.trim().slice(0, 70) || element.tagName
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
  while (walker.nextNode()) {
    const node = walker.currentNode, parent = node.parentElement
    if (!node.textContent.trim() || !parent || parent.closest('script,style') || !visible(parent)) continue
    const range = document.createRange()
    range.selectNodeContents(node)
    for (const rect of range.getClientRects()) if (rect.width && rect.height) elements.push({ kind: 'text', visible: true, allowOverlap: !!parent.closest('[data-presentation-allow-overlap]'), name: name(parent), left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom })
  }
  const signature = (element) => {
    const s = getComputedStyle(element)
    return [s.color, s.backgroundColor, s.borderColor, s.borderWidth, s.fontWeight, s.boxShadow, s.transform, s.opacity, s.textDecorationLine, s.outlineWidth].join('|')
  }
  for (const [kind, selector] of [['progress', '[data-presentation-progress]'], ['toc', '[data-presentation-toc-entry], [data-presentation-toc] button, button[data-presentation-toc]']]) {
    for (const element of document.querySelectorAll(selector)) {
      if (!element.matches('button,a,[role="button"]')) continue
      elements.push({ kind, visible: visible(element), name: name(element), active: element.getAttribute('aria-current') === 'step' || element.getAttribute('aria-current') === 'true' || element.getAttribute('data-presentation-active') === 'true', appearance: signature(element) })
    }
  }
  for (const element of document.querySelectorAll('[data-presentation-attribution]')) {
    const style = getComputedStyle(element)
    elements.push({ kind: 'attribution', visible: visible(element), name: name(element), fontSize: parseFloat(style.fontSize), browserDefault: ['rgb(0, 0, 238)', 'rgb(85, 26, 139)'].includes(style.color) && style.textDecorationLine.includes('underline') })
  }
  return elements
}
