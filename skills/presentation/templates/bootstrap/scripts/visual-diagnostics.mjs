// Only this function executes in Chromium; all decisions below use plain data.
export function readVisualSnapshot() {
  const visible = element => {
    const rect = element.getBoundingClientRect()
    if (rect.width <= 0 || rect.height <= 0) return false
    for (let current = element; current; current = current.parentElement) {
      const css = getComputedStyle(current)
      if (css.visibility === 'hidden' || css.display === 'none' || Number(css.opacity) === 0) return false
    }
    return true
  }
  const describe = element => element.closest('[data-entity-id]')?.getAttribute('data-entity-id') || element.getAttribute('aria-label') || element.getAttributeNames().filter(name => name.startsWith('data-presentation-')).join(',') || element.textContent.trim().slice(0, 60) || element.tagName
  const texts = []
  const elements = new Map()
  const walker = document.createTreeWalker(document.querySelector('[data-presentation]') || document.body, NodeFilter.SHOW_TEXT)
  while (walker.nextNode()) {
    const node = walker.currentNode, parent = node.parentElement
    if (!node.textContent.trim() || !visible(parent)) continue
    if (!elements.has(parent)) elements.set(parent, elements.size)
    const range = document.createRange()
    range.selectNodeContents(node)
    for (const rect of range.getClientRects()) if (rect.width && rect.height) texts.push({
      element: elements.get(parent), label: describe(parent), allowOverlap: !!parent.closest('[data-presentation-allow-overlap]'),
      rect: { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom },
    })
  }
  const chrome = ['progress-item', 'toc-item'].map(hook => ({ hook, controls: [...document.querySelectorAll(`[data-presentation-${hook}]`)].filter(visible).map(node => {
    const s = getComputedStyle(node)
    return { active: node.getAttribute('data-presentation-active') === 'true', signature: [s.color, s.backgroundColor, s.borderColor, s.fontWeight, s.textDecorationLine, s.boxShadow, s.outlineStyle, s.opacity].join('|') }
  }) }))
  const link = document.querySelector('[data-presentation-attribution]')
  const css = link && getComputedStyle(link)
  const attribution = link ? { visible: visible(link), fontSize: parseFloat(css.fontSize), browserDefault: ['rgb(0, 0, 238)', 'rgb(85, 26, 139)'].includes(css.color) && css.textDecorationLine.includes('underline') } : null
  return { texts, chrome, attribution }
}
export function diagnoseVisualSnapshot({ texts, chrome, attribution }) {
  const warnings = []
  for (let a = 0; a < texts.length; a++) for (let b = a + 1; b < texts.length; b++) {
    const x = texts[a], y = texts[b]
    if (x.element === y.element || x.allowOverlap || y.allowOverlap) continue
    const width = Math.min(x.rect.right, y.rect.right) - Math.max(x.rect.left, y.rect.left)
    const height = Math.min(x.rect.bottom, y.rect.bottom) - Math.max(x.rect.top, y.rect.top)
    if (width > 1 && height > 1) warnings.push(`overlap: ${x.label} <> ${y.label}`)
  }
  for (const { hook, controls } of chrome) {
    const active = controls.find(node => node.active), inactive = controls.find(node => !node.active)
    if (active && inactive && active.signature === inactive.signature) warnings.push(`indistinct active chrome: data-presentation-${hook}`)
  }
  if (!attribution || !attribution.visible) warnings.push('missing attribution: style [data-presentation-attribution]')
  else if (attribution.fontSize < 11 || attribution.browserDefault) warnings.push('unpolished attribution: style [data-presentation-attribution]')
  return [...new Set(warnings)]
}
