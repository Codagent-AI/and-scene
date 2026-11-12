/* global document, getComputedStyle, Node */
// Serializable: executed in the inspected page, with no Node-side dependencies.
export function collectDiagnostics() {
  const warnings = []
  const visible = (element) => {
    const rect = element.getBoundingClientRect()
    if (rect.width <= 0 || rect.height <= 0) return false
    for (let ancestor = element; ancestor; ancestor = ancestor.parentElement) {
      const css = getComputedStyle(ancestor)
      if (css.visibility === 'hidden' || css.visibility === 'collapse' || css.display === 'none' || css.opacity === '0') return false
    }
    return true
  }
  const label = (element) => `${element.tagName.toLowerCase()}[${(element.textContent?.trim() || element.getAttribute('aria-label') || '').trim().slice(0, 70)}]`
  const controlSelector = 'button,a[href],input,select,textarea,summary,[role="button"],[role="tab"],[role="checkbox"],[role="switch"],[role="slider"]'
  const boxes = []
  for (const element of document.querySelectorAll('body *')) {
    if (!visible(element) || element.closest('[data-presentation-allow-overlap]') || element.closest('script,style,svg')) continue
    // A control's entire hit area is chrome, including icon-only controls. Avoid
    // counting its own nested text again as a separate collision candidate.
    const control = element.closest(controlSelector)
    if (control) {
      if (control === element) boxes.push({ element, rect: element.getBoundingClientRect() })
      continue
    }
    // Measure each direct text node, including text mixed with inline markup.
    // Individual line rectangles avoid treating wrapped-line whitespace as text.
    for (const node of element.childNodes) {
      if (node.nodeType !== Node.TEXT_NODE || !node.textContent.trim()) continue
      const range = document.createRange()
      range.selectNodeContents(node)
      const rects = typeof range.getClientRects === 'function' ? [...range.getClientRects()] : [range.getBoundingClientRect()]
      for (const rect of rects) if (rect.width > 0 && rect.height > 0) boxes.push({ element, rect })
    }
  }
  const overlaps = new Set()
  for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
    const a = boxes[i], b = boxes[j]
    if (a.element.contains(b.element) || b.element.contains(a.element)) continue
    const width = Math.min(a.rect.right, b.rect.right) - Math.max(a.rect.left, b.rect.left)
    const height = Math.min(a.rect.bottom, b.rect.bottom) - Math.max(a.rect.top, b.rect.top)
    if (width > 1 && height > 1) overlaps.add(`overlap: ${label(a.element)} / ${label(b.element)}`)
  }
  warnings.push(...overlaps)
  const signature = (element) => {
    const css = getComputedStyle(element)
    return ['color', 'backgroundColor', 'borderColor', 'borderWidth', 'fontWeight', 'opacity', 'textDecorationLine', 'boxShadow', 'transform'].map((key) => css[key]).join('|')
  }
  for (const selector of ['[data-presentation-progress]', '[data-presentation-toc]']) {
    const group = document.querySelector(selector)
    if (!group || !visible(group)) continue
    const active = group.querySelector('[aria-current="step"], [aria-current="true"], [data-active="true"]')
    const inactive = [...group.querySelectorAll('button,a')].find((element) => element !== active && !element.hasAttribute('aria-current') && element.getAttribute('data-active') !== 'true')
    if (active && inactive && signature(active) === signature(inactive)) warnings.push(`active navigation indistinct: ${selector} ${label(active)}`)
  }
  const attribution = document.querySelector('[data-presentation-attribution]')
  if (!attribution || !visible(attribution)) warnings.push('attribution missing: style [data-presentation-attribution]')
  else {
    const css = getComputedStyle(attribution)
    if (parseFloat(css.fontSize) < 12 || (['rgb(0, 0, 238)', 'rgb(85, 26, 139)'].includes(css.color) && css.textDecorationLine.includes('underline')) || css.fontFamily.includes('Times New Roman')) warnings.push('attribution unpolished: style [data-presentation-attribution] (font size, browser-default appearance)')
  }
  return warnings
}
