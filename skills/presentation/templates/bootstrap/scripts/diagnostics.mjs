export function intersects(a, b) {
  return Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1 &&
    Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1
}
export function diagnose({ text, chrome = [], active, attribution }, index) {
  const warnings = []
  const areas = [...text, ...chrome]
  for (let i = 0; i < areas.length; i++) {
    for (let j = i + 1; j < areas.length; j++) {
      const first = areas[i]
      const second = areas[j]
      const ownContent = first.ancestors?.includes(second.owner) || second.ancestors?.includes(first.owner)
      if (!first.allowed && !second.allowed && first.owner !== second.owner && !ownContent && intersects(first, second)) {
        warnings.push(`step ${index}: overlap ${first.label} / ${second.label}`)
      }
    }
  }
  for (const item of active) {
    if (item.current === item.other) warnings.push(`step ${index}: indistinct active ${item.kind}`)
  }
  if (!attribution || attribution.fontSize < 11 || attribution.browserDefault) {
    warnings.push(`step ${index}: style [data-presentation-attribution] for legibility`)
  }
  return warnings
}
export function collectDiagnostics() {
  const root = document.querySelector('[data-presentation]')
  const text = []
  const chrome = []
  const identities = new Map()
  const identity = node => {
    if (!identities.has(node)) identities.set(node, identities.size)
    return identities.get(node)
  }
  const ancestors = node => {
    const result = []
    for (let parent = node.parentElement; parent; parent = parent.parentElement) result.push(identity(parent))
    return result
  }
  const area = (node, element, rect, label) => ({
    left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom,
    owner: identity(node), ancestors: ancestors(node), label,
    allowed: !!element.closest('[data-presentation-allow-overlap]'),
  })
  const visible = element => element.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })
  const ink = color => color && color !== 'transparent' && !/(?:,|\/)\s*0(?:\.0*)?\s*\)$/.test(color)
  const edges = style => ['Top', 'Right', 'Bottom', 'Left'].map(side => {
    const width = parseFloat(style[`border${side}Width`])
    const treatment = style[`border${side}Style`]
    const color = style[`border${side}Color`]
    return width > 0 && !['none', 'hidden'].includes(treatment) && ink(color) ? `${width} ${treatment} ${color}` : ''
  })
  const outline = style => parseFloat(style.outlineWidth) > 0 &&
    !['none', 'hidden'].includes(style.outlineStyle) && ink(style.outlineColor)
    ? `${style.outlineWidth} ${style.outlineStyle} ${style.outlineColor}` : ''
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  while (walker.nextNode()) {
    const node = walker.currentNode
    const element = node.parentElement
    if (!node.textContent.trim() || !visible(element)) continue
    const range = document.createRange()
    range.selectNodeContents(node)
    for (const rect of range.getClientRects()) {
      if (rect.width && rect.height) text.push(area(node, element, rect, node.textContent.trim()))
    }
  }
  const chromeRoots = root.querySelectorAll(
    '[data-presentation-header],[data-presentation-footer],[data-presentation-toc],' +
    '[data-presentation-navigation],[data-presentation-progress],[data-presentation-mode],[data-presentation-attribution]',
  )
  const chromeElements = new Set([...chromeRoots].flatMap(element => [element, ...element.querySelectorAll('*')]))
  for (const element of chromeElements) {
    if (!visible(element)) continue
    const style = getComputedStyle(element)
    const control = element.matches('button,a,input,select,textarea,[role="button"],[data-presentation-progress-entry],[data-presentation-toc-entry]')
    const painted = ink(style.backgroundColor) || edges(style).some(Boolean) || outline(style) || style.boxShadow !== 'none'
    if (!control && !painted) continue
    const rect = element.getBoundingClientRect()
    if (!rect.width || !rect.height) continue
    const hook = element.getAttributeNames().find(name => name.startsWith('data-presentation-') && name !== 'data-presentation-allow-overlap')
    const label = hook ? `[${hook}]` : element.getAttribute('aria-label') ?? element.tagName.toLowerCase()
    chrome.push(area(element, element, rect, `chrome ${label}`))
  }
  const signature = element => {
    const style = getComputedStyle(element)
    return JSON.stringify([
      style.color, ink(style.backgroundColor) ? style.backgroundColor : '', style.fontWeight,
      style.opacity, style.textDecorationLine, style.boxShadow, style.transform, ...edges(style), outline(style),
    ])
  }
  const active = []
  for (const kind of ['progress', 'toc']) {
    const current = root.querySelector(`[data-presentation-${kind}-entry][data-active="true"]`)
    const other = root.querySelector(`[data-presentation-${kind}-entry][data-active="false"]`)
    if (current && other) active.push({ kind, current: signature(current), other: signature(other) })
  }
  const link = root.querySelector('[data-presentation-attribution]')
  const style = link && getComputedStyle(link)
  return { text, chrome, active, attribution: link ? { fontSize: parseFloat(style.fontSize),
    browserDefault: ['rgb(0, 0, 238)', 'rgb(85, 26, 139)'].includes(style.color) && style.textDecorationLine.includes('underline') } : null }
}
