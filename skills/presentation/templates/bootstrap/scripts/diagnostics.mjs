// Kept serializable: this function runs inside the inspected browser page.
export function inspectDOM() {
  const warnings = []
  const visible = element => {
    const style = getComputedStyle(element)
    const rect = element.getBoundingClientRect()
    return style.visibility !== 'hidden' && style.display !== 'none' && Number(style.opacity) > 0 && rect.width > 0 && rect.height > 0 && element.checkVisibility({ opacityProperty: true, visibilityProperty: true })
  }
  const describe = element => element.getAttribute('aria-label') || element.getAttribute('data-entity-id') || element.textContent.trim().slice(0, 55) || element.tagName
  const rectangles = []
  const root = document.querySelector('[data-presentation-root]') || document.body
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  while (walker.nextNode()) {
    const node = walker.currentNode
    const owner = node.parentElement
    if (!node.textContent.trim() || !visible(owner) || owner.closest('[data-presentation-allow-overlap]')) continue
    const range = document.createRange()
    range.selectNodeContents(node)
    for (const rect of range.getClientRects()) if (rect.width && rect.height) rectangles.push({ rect, owner })
  }
  for (const owner of root.querySelectorAll('button, a, [data-presentation-marker]')) {
    if (visible(owner) && !owner.closest('[data-presentation-allow-overlap]')) rectangles.push({ rect: owner.getBoundingClientRect(), owner })
  }
  for (let i = 0; i < rectangles.length; i++) for (let j = i + 1; j < rectangles.length; j++) {
    const a = rectangles[i], b = rectangles[j]
    if (a.owner.contains(b.owner) || b.owner.contains(a.owner)) continue
    const x = Math.min(a.rect.right, b.rect.right) - Math.max(a.rect.left, b.rect.left)
    const y = Math.min(a.rect.bottom, b.rect.bottom) - Math.max(a.rect.top, b.rect.top)
    if (x > 1 && y > 1) warnings.push(`overlap: ${describe(a.owner)} / ${describe(b.owner)}`)
  }
  const signature = element => {
    const s = getComputedStyle(element)
    return [s.color, s.backgroundColor, s.fontWeight, s.borderColor, s.boxShadow, s.opacity, s.textDecorationLine].join('|')
  }
  for (const name of ['progress', 'toc']) {
    const container = root.querySelector(`[data-presentation-${name}]`)
    const active = container?.querySelector('[data-presentation-active="true"]')
    const inactive = container?.querySelector('[data-presentation-active="false"]')
    if (active && inactive && visible(active) && signature(active) === signature(inactive)) warnings.push(`indistinct active ${name}: style [data-presentation-active="true"]`)
  }
  const attribution = root.querySelector('[data-presentation-attribution] a')
  if (!attribution || !visible(attribution)) warnings.push('missing attribution: style [data-presentation-attribution]')
  else {
    const style = getComputedStyle(attribution)
    if (parseFloat(style.fontSize) < 11 || (style.textDecorationLine.includes('underline') && (style.color === 'rgb(0, 0, 238)' || style.fontFamily.includes('Times')))) warnings.push('unpolished attribution: style [data-presentation-attribution]')
  }
  return [...new Set(warnings)]
}
