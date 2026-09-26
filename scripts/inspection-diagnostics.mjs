export function inspectVisiblePresentation() {
  const warnings = []
  const visible = (element) => {
    const style = getComputedStyle(element)
    const rect = element.getBoundingClientRect()
    return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) > 0.05 && rect.width > 0 && rect.height > 0
  }
  const candidates = [...document.querySelectorAll('h1,h2,h3,p,a,button,[data-presentation-node="box"],[data-presentation-node="label"],[data-presentation-node="symbol-chip"],[data-presentation-attribution]')].filter(visible)
  const label = (element) => (element.getAttribute('aria-label') || element.textContent || element.tagName).trim().replace(/\s+/g, ' ').slice(0, 48)
  for (let leftIndex = 0; leftIndex < candidates.length; leftIndex += 1) for (let rightIndex = leftIndex + 1; rightIndex < candidates.length; rightIndex += 1) {
    const left = candidates[leftIndex], right = candidates[rightIndex]
    if (left.contains(right) || right.contains(left)) continue
    const leftAllowance = left.closest('[data-presentation-allow-overlap]')
    const rightAllowance = right.closest('[data-presentation-allow-overlap]')
    const allowed = leftAllowance && leftAllowance === rightAllowance
    const a = left.getBoundingClientRect(), b = right.getBoundingClientRect()
    const overlapWidth = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left))
    const overlapHeight = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top))
    if (overlapWidth * overlapHeight > 16 && !allowed) warnings.push(`overlap: “${label(left)}” / “${label(right)}”`)
  }
  const activeControls = [...document.querySelectorAll('[data-presentation-progress-item][data-presentation-active="true"], [data-presentation-toc-item][data-presentation-active="true"]')]
  for (const active of activeControls) {
    const group = active.hasAttribute('data-presentation-progress-item') ? '[data-presentation-progress-item][data-presentation-active="false"]' : '[data-presentation-toc-item][data-presentation-active="false"]'
    const inactive = document.querySelector(group)
    if (!inactive) continue
    const activeStyle = getComputedStyle(active), inactiveStyle = getComputedStyle(inactive)
    const signature = (style, element) => [style.color, style.backgroundColor, style.borderColor, style.fontWeight, style.opacity, element.getBoundingClientRect().width].join('|')
    if (signature(activeStyle, active) === signature(inactiveStyle, inactive)) warnings.push(`active navigation is visually indistinct: ${active.getAttribute('aria-label') || active.textContent?.trim() || active.tagName}`)
  }
  const attribution = document.querySelector('[data-presentation-attribution]')
  if (!attribution || !visible(attribution)) warnings.push('attribution is missing; style the data-presentation-attribution hook')
  else {
    const style = getComputedStyle(attribution)
    const size = parseFloat(style.fontSize)
    const browserDefault = style.textDecorationLine.includes('underline') && style.color === 'rgb(0, 0, 238)' && style.backgroundColor === 'rgba(0, 0, 0, 0)'
    if (size < 10 || browserDefault) warnings.push(`attribution is undersized or browser-default (${size}px); style the data-presentation-attribution hook`)
  }
  return warnings
}
