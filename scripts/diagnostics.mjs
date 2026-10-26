export function overlaps(a, b) {
  return Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x) > 1 && Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y) > 1
}
export function diagnostics({ texts, controls, attribution }, step) {
  const warnings = []
  for (let i = 0; i < texts.length; i++) for (let j = i + 1; j < texts.length; j++) {
    const a = texts[i], b = texts[j]
    if (!a.allowed && !b.allowed && overlaps(a, b)) warnings.push(`Step ${step}: overlap between "${a.name}" and "${b.name}"`)
  }
  for (const kind of ['progress', 'toc']) {
    const group = controls.filter(c => c.kind === kind)
    const active = group.find(c => c.active)
    if (active && group.some(c => !c.active && c.signature === active.signature)) warnings.push(`Step ${step}: indistinct active ${kind} chrome`)
  }
  if (!attribution || attribution.fontSize < 11 || attribution.browserDefault) warnings.push(`Step ${step}: unpolished attribution; style [data-presentation-attribution]`)
  return warnings
}
// This function runs inside Chromium. Keep it closed over browser globals only.
export function collectDiagnostics() {
  const visible = element => {
    const style = getComputedStyle(element)
    const rect = element.getBoundingClientRect()
    return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) !== 0 && rect.width > 0 && rect.height > 0 && element.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })
  }
  const texts = [...document.querySelectorAll('[data-presentation] button,[data-presentation-attribution]')].filter(visible).map(element => {
    const r = element.getBoundingClientRect()
    return { name: element.textContent.trim(), x: r.x, y: r.y, width: r.width, height: r.height, allowed: !!element.closest('[data-presentation-allow-overlap]') }
  })
  const walker = document.createTreeWalker(document.querySelector('[data-presentation]'), NodeFilter.SHOW_TEXT)
  while (walker.nextNode()) {
    const node = walker.currentNode; const parent = node.parentElement
    if (!node.textContent.trim() || ['STYLE', 'SCRIPT'].includes(parent.tagName) || !visible(parent) || parent.closest('button,[data-presentation-attribution]')) continue
    const range = document.createRange(); range.selectNodeContents(node)
    for (const r of range.getClientRects()) if (r.width && r.height) texts.push({ name: node.textContent.trim(), x: r.x, y: r.y, width: r.width, height: r.height, allowed: !!parent.closest('[data-presentation-allow-overlap]') })
  }
  const controls = [...document.querySelectorAll('[data-presentation-progress-step],[data-presentation-toc-entry]')].filter(visible).map(element => {
    const s = getComputedStyle(element)
    return { kind: element.hasAttribute('data-presentation-progress-step') ? 'progress' : 'toc', active: element.getAttribute('data-presentation-active') === 'true', signature: [s.color, s.backgroundColor, s.fontWeight, s.borderColor, s.boxShadow, s.opacity, s.outlineStyle, s.transform].join('|') }
  })
  const a = document.querySelector('[data-presentation-attribution]')
  const s = a && getComputedStyle(a)
  return { texts, controls, attribution: a && visible(a) ? { fontSize: parseFloat(s.fontSize), browserDefault: ['rgb(0, 0, 238)', 'rgb(85, 26, 139)'].includes(s.color) && s.textDecorationLine.includes('underline') } : null }
}
