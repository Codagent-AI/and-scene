export function diagnose(elements) {
  const warnings = []
  const collisions = elements.filter((element) => element.visible && !element.allowOverlap && ['text', 'chrome'].includes(element.kind))
  for (let i = 0; i < collisions.length; i++) for (let j = i + 1; j < collisions.length; j++) {
    const a = collisions[i], b = collisions[j]
    // A control owns its label, and chrome containers own their nested controls.
    if ((a.kind === 'chrome' || b.kind === 'chrome') && a.id !== undefined && b.id !== undefined &&
      (a.id === b.id || a.ancestors?.includes(b.id) || b.ancestors?.includes(a.id))) continue
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
  const identities = new Map()
  const identity = (element) => {
    if (!identities.has(element)) identities.set(element, identities.size)
    return identities.get(element)
  }
  const relationships = (element) => {
    const ancestors = []
    for (let parent = element.parentElement; parent; parent = parent.parentElement) ancestors.push(identity(parent))
    return { id: identity(element), ancestors }
  }
  const bounds = (rect) => ({ left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom })
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
    for (const rect of range.getClientRects()) if (rect.width && rect.height) elements.push({ kind: 'text', visible: true, allowOverlap: !!parent.closest('[data-presentation-allow-overlap]'), name: name(parent), ...relationships(parent), ...bounds(rect) })
  }
  // Include geometric chrome, not just text: an empty progress dot or icon-only
  // button can obscure scene text even though it contributes no text range.
  const chromeSelector = [
    '[data-presentation-header]', '[data-presentation-footer]',
    '[data-presentation-toc]', '[data-presentation-navigation]',
    '[data-presentation-title]', '[data-presentation-step-title]',
    '[data-presentation-marker]', '[data-presentation-caption]',
    '[data-presentation-mode-toggle]', '[data-presentation-attribution]',
    '[data-presentation-prev]', '[data-presentation-next]',
    '[data-presentation-progress]', '[data-presentation-toc-entry]',
  ].join(',')
  const chrome = new Set(document.querySelectorAll(chromeSelector))
  for (const container of [...chrome]) {
    for (const control of container.querySelectorAll('button,a,[role="button"]')) chrome.add(control)
  }
  for (const element of chrome) {
    if (!visible(element)) continue
    elements.push({ kind: 'chrome', visible: true, allowOverlap: !!element.closest('[data-presentation-allow-overlap]'),
      name: name(element), ...relationships(element), ...bounds(element.getBoundingClientRect()) })
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
