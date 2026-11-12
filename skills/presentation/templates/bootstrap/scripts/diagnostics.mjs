/* global document, getComputedStyle, Node */
// Serializable: executed in the inspected page, with no Node-side dependencies.
export function collectDiagnostics() {
  const warnings = []
  const visible = (element) => {
    const rect = element.getBoundingClientRect()
    const css = getComputedStyle(element)
    return rect.width > 0 && rect.height > 0 && css.visibility !== 'hidden' && css.display !== 'none' && Number(css.opacity) !== 0
  }
  const label = (element) => `${element.tagName.toLowerCase()}[${(element.textContent || element.getAttribute('aria-label') || '').trim().slice(0, 70)}]`
  const leaves = [...document.querySelectorAll('body *')].filter((element) => visible(element) && !element.closest('[data-presentation-allow-overlap]') && !['SCRIPT', 'STYLE', 'SVG', 'PATH'].includes(element.tagName) && [...element.childNodes].some((node) => node.nodeType === Node.TEXT_NODE && node.textContent.trim()) && ![...element.children].some((child) => child.textContent.trim()))
  const boxes = leaves.map((element) => {
    const range = document.createRange()
    range.selectNodeContents(element)
    return { element, rect: range.getBoundingClientRect() }
  })
  for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
    const a = boxes[i], b = boxes[j]
    if (a.element.contains(b.element) || b.element.contains(a.element)) continue
    const width = Math.min(a.rect.right, b.rect.right) - Math.max(a.rect.left, b.rect.left)
    const height = Math.min(a.rect.bottom, b.rect.bottom) - Math.max(a.rect.top, b.rect.top)
    if (width > 1 && height > 1) warnings.push(`overlap: ${label(a.element)} / ${label(b.element)}`)
  }
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
