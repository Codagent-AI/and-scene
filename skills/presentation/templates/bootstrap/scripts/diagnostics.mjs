export function intersects(a, b) {
  return Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1 &&
    Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1
}
export function diagnose({ text, active, attribution }, index) {
  const warnings = []
  for (let i = 0; i < text.length; i++) {
    for (let j = i + 1; j < text.length; j++) {
      if (!text[i].allowed && !text[j].allowed && text[i].owner !== text[j].owner && intersects(text[i], text[j])) {
        warnings.push(`step ${index}: overlap ${text[i].label} / ${text[j].label}`)
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
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  let textIdentity = 0
  while (walker.nextNode()) {
    const node = walker.currentNode
    const element = node.parentElement
    const style = getComputedStyle(element)
    if (!node.textContent.trim() || style.visibility === 'hidden' || element.closest('svg')) continue
    if (!element.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })) continue
    const range = document.createRange()
    range.selectNodeContents(node)
    const owner = textIdentity++
    for (const rect of range.getClientRects()) {
      if (!rect.width || !rect.height) continue
      text.push({ left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom,
        owner, label: node.textContent.trim(),
        allowed: !!element.closest('[data-presentation-allow-overlap]') })
    }
  }
  const signature = element => {
    const style = getComputedStyle(element)
    return ['color', 'backgroundColor', 'borderColor', 'fontWeight', 'opacity', 'textDecorationLine', 'boxShadow', 'outlineStyle', 'transform'].map(key => style[key]).join('|')
  }
  const active = []
  for (const kind of ['progress', 'toc']) {
    const current = root.querySelector(`[data-presentation-${kind}-entry][data-active="true"]`)
    const other = root.querySelector(`[data-presentation-${kind}-entry][data-active="false"]`)
    if (current && other) active.push({ kind, current: signature(current), other: signature(other) })
  }
  const link = root.querySelector('[data-presentation-attribution]')
  const style = link && getComputedStyle(link)
  return { text, active, attribution: link ? { fontSize: parseFloat(style.fontSize),
    browserDefault: ['rgb(0, 0, 238)', 'rgb(85, 26, 139)'].includes(style.color) && style.textDecorationLine.includes('underline') } : null }
}
