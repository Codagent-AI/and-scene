export function findOverlaps(items) {
  const warnings = []
  for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++) {
    const a = items[i], b = items[j]
    if (a.allowed || b.allowed || a.owner === b.owner || a.ancestors?.includes(b.owner) || b.ancestors?.includes(a.owner)) continue
    if (Math.min(a.right, b.right) - Math.max(a.left, b.left) > 2 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 2) warnings.push(`overlap: ${a.label} / ${b.label}`)
  }
  return warnings
}
export function diagnose({ texts, chrome = [], controls, attribution }) {
  const warnings = findOverlaps([...texts, ...chrome])
  for (const active of controls.filter(c => c.active)) {
    const signature = JSON.stringify(active.visual)
    if (controls.some(c => !c.active && c.kind === active.kind && JSON.stringify(c.visual) === signature)) warnings.push(`indistinct active navigation: ${active.kind} ${active.label}`)
  }
  if (!attribution) warnings.push('missing attribution: style [data-presentation-attribution]')
  else if (attribution.size < 11 || attribution.browserDefault) warnings.push('unpolished attribution: style [data-presentation-attribution]')
  return warnings
}
// Serialized into the page by Playwright; keep this function self-contained.
export function collectDiagnostics() {
  const texts = [], chrome = [], controls = []
  const root = document.querySelector('[data-presentation]')
  const owners = new Map()
  function visible(el) {
    for (let node = el; node; node = node.parentElement) {
      const style = getComputedStyle(node)
      if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) return false
    }
    return el.getBoundingClientRect().width > 0 && el.getBoundingClientRect().height > 0
  }
  function owner(node) {
    if (!owners.has(node)) owners.set(node, owners.size)
    return owners.get(node)
  }
  function item(node, rect, label) {
    const el = node.nodeType === Node.TEXT_NODE ? node.parentElement : node
    const ancestors = []
    for (let parent = node.parentElement; parent; parent = parent.parentElement) ancestors.push(owner(parent))
    return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom, owner: owner(node), ancestors, label, allowed: !!el.closest('[data-presentation-allow-overlap]') }
  }
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  while (walker.nextNode()) {
    const node = walker.currentNode, el = node.parentElement
    if (!node.textContent.trim() || !visible(el) || el.closest('script,style')) continue
    const range = document.createRange()
    range.selectNodeContents(node)
    const label = el.closest('[data-entity-id]')?.getAttribute('data-entity-id') ?? node.textContent.trim().slice(0, 60)
    texts.push(item(node, range.getBoundingClientRect(), label))
  }
  const hooks = ['prev', 'next', 'progress-step', 'toc-entry', 'mode-toggle', 'attribution', 'caption', 'title', 'marker', 'document-title', 'brand']
  for (const hook of hooks) {
    for (const el of root.querySelectorAll(`[data-presentation-${hook}]`)) {
      if (el.closest('[data-presentation-stage]') || !visible(el)) continue
      // Non-interactive chrome with visible text is block-level, so its box spans the container; its glyphs are already collected.
      if (!el.matches('button,a') && texts.some(t => t.ancestors.includes(owner(el)))) continue
      const name = el.getAttribute('aria-label') || el.textContent.trim().slice(0, 60)
      chrome.push(item(el, el.getBoundingClientRect(), `${hook}${name ? ` (${name})` : ''}`))
    }
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
  return { texts, chrome, controls, attribution }
}
