// Runs in the browser. Keep dependencies inside this function for page.evaluate.
export function collectDiagnostics() {
  const warnings = []
  const root = document.querySelector('[data-presentation]')
  if (!root) return ['missing presentation root']
  const step = root.getAttribute('data-step-index')
  const visible = element => {
    const style = getComputedStyle(element)
    const box = element.getBoundingClientRect()
    if (!box.width || !box.height || style.visibility === 'hidden' || style.display === 'none') return false
    for (let node = element; node instanceof Element; node = node.parentElement) {
      const ancestor = getComputedStyle(node)
      if (ancestor.opacity === '0' || ancestor.display === 'none' || ancestor.visibility === 'hidden') return false
    }
    return true
  }
  const name = element => element.getAttribute('data-presentation-entity') || element.getAttribute('aria-label') || element.textContent.trim().slice(0, 50) || element.tagName
  // Leaf text ranges avoid treating a card's enclosing box as colliding with its own text.
  const text = []
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  let node
  while ((node = walker.nextNode())) {
    const element = node.parentElement
    if (!node.textContent.trim() || !visible(element) || element.closest('[data-presentation-allow-overlap]')) continue
    const range = document.createRange()
    range.selectNodeContents(node)
    for (const rect of range.getClientRects()) {
      if (rect.width && rect.height) text.push({ element, rect })
    }
  }
  for (const element of root.querySelectorAll('[data-presentation-caption], [data-presentation-title], [data-presentation-marker], [data-presentation-progress-entry], [data-presentation-toc-entry], [data-presentation-prev], [data-presentation-next], [data-presentation-mode-toggle], [data-presentation-attribution]')) {
    if (visible(element) && !element.closest('[data-presentation-allow-overlap]')) text.push({ element, rect: element.getBoundingClientRect() })
  }
  for (let i = 0; i < text.length; i++) for (let j = i + 1; j < text.length; j++) {
    const a = text[i], b = text[j]
    if (a.element === b.element || a.element.contains(b.element) || b.element.contains(a.element)) continue
    const x = Math.min(a.rect.right, b.rect.right) - Math.max(a.rect.left, b.rect.left)
    const y = Math.min(a.rect.bottom, b.rect.bottom) - Math.max(a.rect.top, b.rect.top)
    if (x > 2 && y > 2) warnings.push(`step ${step}: overlap: ${name(a.element)} / ${name(b.element)}`)
  }
  const signature = element => {
    const s = getComputedStyle(element)
    return [s.color, s.backgroundColor, s.borderColor, s.fontWeight, s.opacity, s.boxShadow, s.outline, s.transform, s.textDecoration, s.borderWidth].join(';')
  }
  for (const hook of ['progress-entry', 'toc-entry']) {
    const controls = [...root.querySelectorAll(`[data-presentation-${hook}]`)].filter(visible)
    const active = controls.find(element => element.getAttribute('data-presentation-active') === 'true')
    const inactive = controls.filter(element => element !== active)
    if (active && inactive.length && inactive.every(element => signature(active) === signature(element))) warnings.push(`step ${step}: indistinct active ${hook}`)
  }
  const attribution = root.querySelector('[data-presentation-attribution]')
  if (!attribution || !visible(attribution)) warnings.push(`step ${step}: missing attribution; style [data-presentation-attribution]`)
  else {
    const s = getComputedStyle(attribution)
    const browserDefault = (s.color === 'rgb(0, 0, 238)' || s.color === 'rgb(85, 26, 139)') && s.textDecorationLine.includes('underline')
    if (parseFloat(s.fontSize) < 11 || browserDefault) warnings.push(`step ${step}: unpolished attribution; style [data-presentation-attribution]`)
  }
  return [...new Set(warnings)]
}
