export function diagnosePresentation() {
  const selectors = '[data-presentation-caption], [data-presentation-header], [data-presentation-toc-item], [data-presentation-progress-item], .presentation-controls, [data-presentation-attribution], [data-presentation-node="box"], [data-presentation-node="symbol-chip"], [data-presentation-node="emphasis"]'
  const elements = [...document.querySelectorAll(selectors)].filter(element => element.getClientRects().length && getComputedStyle(element).visibility !== 'hidden' && element.innerText?.trim())
  const overlaps = (a, b) => { const x = a.getBoundingClientRect(), y = b.getBoundingClientRect(); return x.left < y.right && x.right > y.left && x.top < y.bottom && x.bottom > y.top }
  const name = element => element.getAttribute('data-presentation-node') || element.className || (element.hasAttribute('data-presentation-toc-item') ? 'table of contents' : 'chrome')
  const warnings = []
  for (let i = 0; i < elements.length; i++) for (let j = i + 1; j < elements.length; j++) {
    const a = elements[i], b = elements[j]
    if (a.contains(b) || b.contains(a) || a.closest('[data-presentation-allow-overlap]') || b.closest('[data-presentation-allow-overlap]')) continue
    if (overlaps(a, b)) warnings.push(`possible overlap: ${name(a)} / ${name(b)}`)
  }
  const active = document.querySelector('[data-presentation-progress-item][aria-current="step"], [data-presentation-toc-item][aria-current="location"]')
  const inactive = document.querySelector('[data-presentation-progress-item]:not([aria-current]), [data-presentation-toc-item]:not([aria-current])')
  if (active && inactive) {
    const a = getComputedStyle(active), b = getComputedStyle(inactive)
    if (a.color === b.color && a.backgroundColor === b.backgroundColor && a.fontWeight === b.fontWeight && a.outlineStyle === 'none') warnings.push('active navigation may be visually indistinct')
  }
  const attribution = document.querySelector('[data-presentation-attribution]')
  if (!attribution) warnings.push('missing attribution; style [data-presentation-attribution]')
  else {
    const style = getComputedStyle(attribution)
    if (parseFloat(style.fontSize) < 11 || (style.color === 'rgb(0, 0, 238)' && style.textDecorationLine.includes('underline'))) warnings.push('attribution may be browser-default or undersized; style [data-presentation-attribution]')
  }
  return warnings
}
