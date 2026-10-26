export function findOverlaps(items) {
  const warnings = []
  for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++) {
    const a = items[i], b = items[j]
    if (a.allowed || b.allowed || a.owner === b.owner) continue
    if (Math.min(a.right, b.right) - Math.max(a.left, b.left) > 2 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 2) warnings.push(`overlap: ${a.label} / ${b.label}`)
  }
  return warnings
}
export function diagnose({ texts, controls, attribution }) {
  const warnings = findOverlaps(texts)
  for (const active of controls.filter(c => c.active)) {
    const inactive = controls.find(c => !c.active && c.kind === active.kind)
    if (inactive && JSON.stringify(active.visual) === JSON.stringify(inactive.visual)) warnings.push(`indistinct active navigation: ${active.kind} ${active.label}`)
  }
  if (!attribution) warnings.push('missing attribution: style [data-presentation-attribution]')
  else if (attribution.size < 11 || attribution.browserDefault) warnings.push('unpolished attribution: style [data-presentation-attribution]')
  return warnings
}
// Serialized into the page by Playwright; keep this function self-contained.
export function collectDiagnostics() {
  const texts = [], controls = []
  const root = document.querySelector('[data-presentation]')
  const owners = new Map()
  function visible(el) {
    for (let node = el; node; node = node.parentElement) {
      const style = getComputedStyle(node)
      if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) return false
    }
    return el.getBoundingClientRect().width > 0 && el.getBoundingClientRect().height > 0
  }
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  while (walker.nextNode()) {
    const node = walker.currentNode, el = node.parentElement
    if (!node.textContent.trim() || !visible(el) || el.closest('script,style')) continue
    const range = document.createRange()
    range.selectNodeContents(node)
    const rect = range.getBoundingClientRect()
    if (!owners.has(el)) owners.set(el, owners.size)
    const label = el.closest('[data-entity-id]')?.getAttribute('data-entity-id') ?? el.textContent.trim().slice(0, 60)
    texts.push({ left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom, owner: owners.get(el), label, allowed: !!el.closest('[data-presentation-allow-overlap]') })
  }
  for (const kind of ['progress-step', 'toc-entry']) {
    for (const el of root.querySelectorAll(`[data-presentation-${kind}]`)) {
      if (!visible(el)) continue
      const style = getComputedStyle(el)
      controls.push({ kind, label: el.getAttribute('aria-label') ?? el.textContent, active: el.getAttribute('data-presentation-active') === 'true', visual: ['color','backgroundColor','borderColor','borderWidth','fontWeight','textDecorationLine','opacity','boxShadow','transform'].map(key => style[key]) })
    }
  }
  const link = root.querySelector('[data-presentation-attribution]')
  const style = link && getComputedStyle(link)
  const attribution = link && visible(link) ? { size: parseFloat(style.fontSize), browserDefault: ['rgb(0, 0, 238)', 'rgb(85, 26, 139)'].includes(style.color) && style.textDecorationLine.includes('underline') } : null
  return { texts, controls, attribution }
}
