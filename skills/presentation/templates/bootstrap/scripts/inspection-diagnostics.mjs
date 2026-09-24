// Runs inside the page via page.evaluate, so it must stay self-contained.
export function collectVisualDiagnostics() {
  const selectors = '[data-presentation-node], [data-presentation-footer] *, [data-presentation-toc-item], [data-presentation-progress-item], [data-presentation-attribution] a'
  const isVisibleLeaf = (element) => {
    const style = getComputedStyle(element)
    return element.textContent?.trim() && !element.querySelector(selectors) && style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) > 0
  }
  const describe = (element) => {
    const kind = element.getAttribute('data-presentation-node')
      ?? (element.hasAttribute('data-presentation-footer') ? 'footer'
        : element.hasAttribute('data-presentation-toc') ? 'table of contents'
          : element.hasAttribute('data-presentation-attribution') ? 'attribution'
            : element.tagName.toLowerCase())
    return `${kind}: ${element.textContent.trim().replace(/\s+/g, ' ').slice(0, 45)}`
  }
  const items = [...document.querySelectorAll(selectors)]
    .filter(isVisibleLeaf)
    .filter((element) => !element.closest('[data-presentation-allow-overlap]'))
    .map((element) => ({ element, rect: element.getBoundingClientRect() }))
  const intersects = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top
  const overlaps = []
  for (let left = 0; left < items.length; left++) {
    for (let right = left + 1; right < items.length; right++) {
      if (intersects(items[left].rect, items[right].rect)) overlaps.push(`${describe(items[left].element)} overlaps ${describe(items[right].element)}`)
    }
  }

  const signature = (style) => [style.color, style.backgroundColor, style.fontWeight, style.borderColor, style.outlineStyle].join('|')
  const weakActiveState = (container, item) => {
    if (!document.querySelector(container)) return false
    const current = document.querySelector(`${item}[data-presentation-active="true"]`)
    if (!current) return false
    const currentStyle = getComputedStyle(current)
    const inactive = document.querySelector(`${item}[data-presentation-active="false"]`)
    if (inactive) return signature(currentStyle) === signature(getComputedStyle(inactive))
    return currentStyle.outlineStyle === 'none' && currentStyle.fontWeight === '400' && currentStyle.backgroundColor === 'rgba(0, 0, 0, 0)'
  }
  const weakProgress = weakActiveState('[data-presentation-progress]', '[data-presentation-progress-item]')
  const weakToc = weakActiveState('[data-presentation-toc]', '[data-presentation-toc-item]')

  const attribution = document.querySelector('[data-presentation-attribution] a')
  const attributionStyle = attribution ? getComputedStyle(attribution) : null
  const weakAttribution = !attribution || Number.parseFloat(attributionStyle.fontSize) < 11 || ['rgb(0, 0, 0)', 'rgb(0, 0, 238)'].includes(attributionStyle.color)
  return { overlaps, weakProgress, weakToc, weakAttribution }
}
