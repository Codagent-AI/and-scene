export function collectVisualDiagnostics() {
const selectors = '[data-presentation-node], [data-presentation-footer] *, [data-presentation-toc-item], [data-presentation-progress-item], [data-presentation-attribution] a'
const items = [...document.querySelectorAll(selectors)].filter((element) => {
  const style = getComputedStyle(element)
  return element.textContent?.trim() && !element.querySelector(selectors) && style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) > 0
})
const rect = (element) => element.getBoundingClientRect()
const intersects = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top
const overlaps = []
for (let left = 0; left < items.length; left++) for (let right = left + 1; right < items.length; right++) {
  const a = items[left], b = items[right]
  if (a.closest('[data-presentation-allow-overlap]') || b.closest('[data-presentation-allow-overlap]') || a.hasAttribute('data-presentation-allow-overlap') || b.hasAttribute('data-presentation-allow-overlap')) continue
  if (intersects(rect(a), rect(b))) {
    const label = (element) => `${element.getAttribute('data-presentation-node') ?? (element.hasAttribute('data-presentation-footer') ? 'footer' : element.hasAttribute('data-presentation-toc') ? 'table of contents' : element.hasAttribute('data-presentation-attribution') ? 'attribution' : element.tagName.toLowerCase())}: ${element.textContent.trim().replace(/\s+/g, ' ').slice(0, 45)}`
    overlaps.push(`${label(a)} overlaps ${label(b)}`)
  }
}
const indistinct = (selector, inactiveSelector) => {
  const current = document.querySelector(selector)
  if (!current) return false
  const currentStyle = getComputedStyle(current)
  const inactive = document.querySelector(inactiveSelector)
  if (inactive) {
    const inactiveStyle = getComputedStyle(inactive)
    const signature = (style) => [style.color, style.backgroundColor, style.fontWeight, style.borderColor, style.outlineStyle].join('|')
    return signature(currentStyle) === signature(inactiveStyle)
  }
  return currentStyle.outlineStyle === 'none' && currentStyle.fontWeight === '400' && currentStyle.backgroundColor === 'rgba(0, 0, 0, 0)'
}
const weakProgress = Boolean(document.querySelector('[data-presentation-progress]')) && indistinct('[data-presentation-progress-item][data-presentation-active="true"]', '[data-presentation-progress-item][data-presentation-active="false"]')
const weakToc = Boolean(document.querySelector('[data-presentation-toc]')) && indistinct('[data-presentation-toc-item][data-presentation-active="true"]', '[data-presentation-toc-item][data-presentation-active="false"]')
const attribution = document.querySelector('[data-presentation-attribution] a')
const attributionStyle = attribution ? getComputedStyle(attribution) : null
const weakAttribution = !attribution || Number.parseFloat(attributionStyle.fontSize) < 11 || ['rgb(0, 0, 0)', 'rgb(0, 0, 238)'].includes(attributionStyle.color)
return { overlaps, weakProgress, weakToc, weakAttribution }
}
