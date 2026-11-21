// This function runs inside the browser via page.evaluate.
export function inspectStep() {
  const root = document.querySelector('[data-presentation]')
  const exemptions = '[data-presentation-allow-overlap]'
  const warnings = []
  const chrome = [
    '[data-presentation-marker]', '[data-presentation-title]', '[data-presentation-caption]',
    '[data-presentation-era]', '[data-presentation-progress-step]', '[data-presentation-previous]',
    '[data-presentation-next]', '[data-presentation-attribution]', '[data-presentation-brand]',
  ].join(',')

  function visible(element) {
    for (let node = element; node instanceof Element; node = node.parentElement) {
      const style = getComputedStyle(node)
      if (style.display === 'none' || style.visibility !== 'visible' || parseFloat(style.opacity) === 0) return false
    }
    return true
  }

  const items = []
  function collect(owner, rectangles, label) {
    for (const rect of rectangles) {
      if (rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.right > 0
        && rect.left < innerWidth && rect.top < innerHeight) {
        items.push({ owner, rect, label })
      }
    }
  }

  const tree = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  while (tree.nextNode()) {
    const node = tree.currentNode
    const label = node.textContent.trim()
    const owner = node.parentElement
    if (!label || owner.closest(`script, style, svg title, svg desc, ${exemptions}`) || !visible(owner)) continue
    const range = document.createRange()
    range.selectNodeContents(node)
    collect(owner, range.getClientRects(), label)
  }

  for (const element of root.querySelectorAll(chrome)) {
    if (element.closest(exemptions) || !visible(element)) continue
    collect(element, element.getClientRects(), element.getAttribute('aria-label')
      || element.textContent.trim() || [...element.attributes].find(attr => attr.name.startsWith('data-presentation-'))?.name)
  }

  const collisions = new Set()
  for (const [index, first] of items.entries()) {
    for (const second of items.slice(index + 1)) {
      if (first.owner.contains(second.owner) || second.owner.contains(first.owner)) continue
      const a = first.rect
      const b = second.rect
      const width = Math.min(a.right, b.right) - Math.max(a.left, b.left)
      const height = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top)
      if (width > 1 && height > 1) collisions.add(`Overlap: "${first.label}" with "${second.label}"`)
    }
  }
  warnings.push(...collisions)

  function appearance(element) {
    return ['', '::before', '::after'].flatMap(pseudo => {
      const style = getComputedStyle(element, pseudo || null)
      if (pseudo && (style.content === 'none' || style.content === 'normal')) return []
      return [
        style.color, style.background, style.border, style.fontSize, style.fontWeight, style.opacity,
        style.outline, style.boxShadow, style.textDecoration, style.transform, style.borderRadius,
        style.width, style.height,
      ]
    }).join('|')
  }

  for (const [name, selector] of [
    ['progress indicator', '[data-presentation-progress-step]'],
    ['table of contents', '[data-presentation-era]'],
  ]) {
    const controls = [...root.querySelectorAll(selector)].filter(visible)
    const active = controls.find(element => element.hasAttribute('data-presentation-active'))
    const inactive = controls.filter(element => !element.hasAttribute('data-presentation-active'))
    if (active && inactive.some(element => appearance(element) === appearance(active))) {
      warnings.push(`Indistinct active ${name}: ${active.getAttribute('aria-label') || active.textContent.trim()}`)
    }
  }

  const attribution = root.querySelector('[data-presentation-attribution]')
  if (!attribution || !visible(attribution)) {
    warnings.push('Missing or hidden attribution. Style [data-presentation-attribution].')
  } else {
    const style = getComputedStyle(attribution)
    const browserLinkColor = /^(rgb\(0, 0, 238\)|rgb\(85, 26, 139\))$/.test(style.color)
    if (parseFloat(style.fontSize) < 12 || (browserLinkColor && style.textDecorationLine.includes('underline'))) {
      warnings.push('Attribution appears undersized or browser-default. Style [data-presentation-attribution].')
    }
  }
  return warnings
}
