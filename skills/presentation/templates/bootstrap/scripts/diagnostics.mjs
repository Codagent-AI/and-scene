// Runs in the page: keep this function self-contained for Playwright serialization.
export function visualDiagnostics() {
  const warnings = []
  const visible = (element) => {
    if (!element.getClientRects().length) return false
    for (let current = element; current; current = current.parentElement) {
      const style = getComputedStyle(current)
      if (['hidden', 'collapse'].includes(style.visibility) || style.display === 'none' || (style.opacity !== '' && Number(style.opacity) === 0)) return false
    }
    return true
  }
  const describe = (element) => element.getAttribute('data-testid') || element.getAttribute('aria-label') || `${element.tagName.toLowerCase()}: ${(element.textContent || '').trim().slice(0, 48)}`
  const nodes = []
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
  while (walker.nextNode()) {
    const text = walker.currentNode
    const element = text.parentElement
    if (!text.textContent.trim() || !element || ['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(element.tagName) || !visible(element) || element.closest('[data-presentation-allow-overlap]')) continue
    const range = document.createRange()
    range.selectNodeContents(text)
    for (const rect of range.getClientRects()) if (rect.width && rect.height) nodes.push({ element, rect })
  }
  for (const element of document.querySelectorAll('[data-presentation-progress] button, [data-presentation-toc] button, [data-presentation-navigation] button, [data-presentation-attribution]')) {
    if (visible(element) && !element.closest('[data-presentation-allow-overlap]')) nodes.push({ element, rect: element.getBoundingClientRect() })
  }
  const reported = new Set()
  for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) {
    const a = nodes[i], b = nodes[j]
    if (a.element === b.element || a.element.contains(b.element) || b.element.contains(a.element)) continue
    const x = Math.min(a.rect.right, b.rect.right) - Math.max(a.rect.left, b.rect.left)
    const y = Math.min(a.rect.bottom, b.rect.bottom) - Math.max(a.rect.top, b.rect.top)
    if (x > 2 && y > 2) {
      const key = [describe(a.element), describe(b.element)].sort().join(' / ')
      if (!reported.has(key)) { reported.add(key); warnings.push(`overlap: ${key}`) }
    }
  }
  const fingerprint = (element) => {
    const style = getComputedStyle(element)
    return ['color', 'backgroundColor', 'borderColor', 'borderWidth', 'borderStyle', 'fontSize', 'fontWeight', 'textDecorationLine', 'boxShadow', 'outline', 'opacity', 'transform'].map((key) => style[key]).join('|')
  }
  for (const group of document.querySelectorAll('[data-presentation-progress], [data-presentation-toc]')) {
    const active = group.querySelector('[aria-current="step"], [data-presentation-active="true"]')
    const inactive = [...group.querySelectorAll('button, a')].find((element) => element !== active && element.getAttribute('data-presentation-active') !== 'true' && !element.hasAttribute('aria-current'))
    if (active && inactive && visible(active) && fingerprint(active) === fingerprint(inactive)) warnings.push(`indistinct active navigation: ${describe(group)}`)
  }
  const attribution = document.querySelector('[data-presentation-attribution]')
  if (!attribution || !visible(attribution)) warnings.push('attribution missing: style [data-presentation-attribution]')
  else {
    const style = getComputedStyle(attribution)
    if (parseFloat(style.fontSize) < 12 || ['rgb(0, 0, 238)', 'rgb(85, 26, 139)'].includes(style.color) || /Times New Roman/.test(style.fontFamily)) warnings.push('attribution undersized or browser-default: style [data-presentation-attribution]')
  }
  return warnings
}
