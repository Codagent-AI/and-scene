// Executed inside the browser. Keep this function self-contained for page.evaluate.
export function collectDiagnostics() {
  const root = document.querySelector('[data-presentation-root]')
  const step = root?.getAttribute('data-step-index') ?? '?'
  const warnings = []
  const visible = element => {
    for (let ancestor = element; ancestor; ancestor = ancestor.parentElement) {
      const style = getComputedStyle(ancestor)
      if (style.visibility === 'hidden' || style.display === 'none' || style.opacity === '0') return false
    }
    return element.getClientRects().length > 0 && !element.closest('[aria-hidden="true"]')
  }
  const name = element => element.getAttribute('data-presentation-entity') || element.getAttribute('aria-label') || element.tagName.toLowerCase() + ':' + element.textContent.trim().slice(0, 45)
  const texts = []
  const chromeSelector = '[data-presentation-header] button,[data-presentation-header] a,[data-presentation-navigation] button,[data-presentation-progress-item],[data-presentation-toc-item],[data-presentation-attribution]'
  for (const element of root?.querySelectorAll(chromeSelector) ?? []) {
    if (!visible(element) || element.closest('[data-presentation-allow-overlap]')) continue
    for (const rect of element.getClientRects()) texts.push({ element, rect, label: name(element) })
  }
  const walker = document.createTreeWalker(root ?? document.body, NodeFilter.SHOW_TEXT)
  while (walker.nextNode()) {
    const node = walker.currentNode
    const element = node.parentElement
    if (!node.textContent.trim() || !element || !visible(element) || element.closest('[data-presentation-allow-overlap]')) continue
    if (['SCRIPT', 'STYLE'].includes(element.tagName) || element.closest(chromeSelector)) continue
    const range = document.createRange(); range.selectNodeContents(node)
    for (const rect of range.getClientRects()) if (rect.width && rect.height) texts.push({ element, rect, label: name(element) })
  }
  for (let a = 0; a < texts.length; a++) for (let b = a + 1; b < texts.length; b++) {
    const first = texts[a], second = texts[b]
    if (first.element === second.element) continue
    const width = Math.min(first.rect.right, second.rect.right) - Math.max(first.rect.left, second.rect.left)
    const height = Math.min(first.rect.bottom, second.rect.bottom) - Math.max(first.rect.top, second.rect.top)
    if (width > 1 && height > 1) warnings.push(`step ${step}: overlap ${first.label} / ${second.label}`)
  }
  const signature = element => {
    const style = getComputedStyle(element)
    return ['color','backgroundColor','borderTopColor','borderLeftColor','borderLeftWidth','fontWeight','transform','boxShadow','opacity'].map(key => style[key]).join('|')
  }
  for (const hook of ['progress', 'toc']) {
    const active = root?.querySelector(`[data-presentation-${hook}-item][data-presentation-active="true"]`)
    const inactive = root?.querySelector(`[data-presentation-${hook}-item][data-presentation-active="false"]`)
    if (active && inactive && visible(active) && signature(active) === signature(inactive)) warnings.push(`step ${step}: indistinct active ${hook}`)
  }
  const attribution = root?.querySelector('[data-presentation-attribution]')
  if (!attribution || !visible(attribution)) warnings.push(`step ${step}: missing attribution; style [data-presentation-attribution]`)
  else {
    const style = getComputedStyle(attribution)
    if (parseFloat(style.fontSize) < 11 || ['rgb(0, 0, 238)', 'rgb(85, 26, 139)'].includes(style.color)) warnings.push(`step ${step}: unpolished attribution; style [data-presentation-attribution]`)
  }
  return [...new Set(warnings)]
}
