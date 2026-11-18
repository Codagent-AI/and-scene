// Runs inside the browser; keep this function free of module-scope dependencies.
export function collectVisualWarnings() {
  const warnings = []
  const host = document.querySelector('[data-presentation]')
  if (!host) return ['Missing presentation host']
  const visible = element => {
    const style = getComputedStyle(element)
    const rect = element.getBoundingClientRect()
    return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) !== 0 && rect.width > 0 && rect.height > 0
  }
  const identify = element => element.closest('[data-presentation-entity]')?.getAttribute('data-presentation-entity') ?? element.outerHTML.slice(0, 120)
  const walker = document.createTreeWalker(host, NodeFilter.SHOW_TEXT)
  const texts = []
  let node
  while ((node = walker.nextNode())) {
    const parent = node.parentElement
    if (!node.textContent.trim() || !parent || ['STYLE', 'SCRIPT'].includes(parent.tagName) || parent.closest('[data-presentation-allow-overlap]') || !visible(parent)) continue
    const range = document.createRange(); range.selectNodeContents(node)
    for (const rect of range.getClientRects()) {
      if (rect.width > 0 && rect.height > 0) texts.push({ parent, rect, text: node.textContent.trim() })
    }
  }
  for (const element of host.querySelectorAll('[data-presentation-prev],[data-presentation-next],[data-presentation-mode-toggle],[data-presentation-progress-step],[data-presentation-toc-entry],[data-presentation-attribution]')) {
    if (visible(element) && !element.closest('[data-presentation-allow-overlap]')) texts.push({ parent: element, rect: element.getBoundingClientRect(), text: 'chrome' })
  }
  for (let i = 0; i < texts.length; i++) {
    for (let j = i + 1; j < texts.length; j++) {
      const a = texts[i]; const b = texts[j]
      if (a.parent.contains(b.parent) || b.parent.contains(a.parent)) continue
      const x = Math.min(a.rect.right, b.rect.right) - Math.max(a.rect.left, b.rect.left)
      const y = Math.min(a.rect.bottom, b.rect.bottom) - Math.max(a.rect.top, b.rect.top)
      if (x > 2 && y > 2) warnings.push(`overlap: ${identify(a.parent)} [${a.text}] / ${identify(b.parent)} [${b.text}]`)
    }
  }
  const signature = element => {
    const style = getComputedStyle(element)
    return ['color', 'backgroundColor', 'borderColor', 'fontWeight', 'textDecorationLine', 'boxShadow', 'opacity', 'transform'].map(key => style[key]).join('|')
  }
  for (const hook of ['progress-step', 'toc-entry']) {
    const controls = [...host.querySelectorAll(`[data-presentation-${hook}]`)].filter(visible)
    const active = controls.find(element => element.getAttribute('data-presentation-active') === 'true')
    const inactive = controls.find(element => element.getAttribute('data-presentation-active') !== 'true')
    if (active && inactive && signature(active) === signature(inactive)) warnings.push(`indistinct active chrome: data-presentation-${hook}`)
  }
  const attribution = host.querySelector('[data-presentation-attribution]')
  if (!attribution || !visible(attribution)) warnings.push('missing attribution: style [data-presentation-attribution]')
  else {
    const style = getComputedStyle(attribution)
    if (parseFloat(style.fontSize) < 12 || (['rgb(0, 0, 238)', 'rgb(85, 26, 139)'].includes(style.color) && style.textDecorationLine.includes('underline'))) warnings.push('unpolished attribution: style [data-presentation-attribution] (minimum 12px; avoid browser-default link treatment)')
  }
  return [...new Set(warnings)]
}
