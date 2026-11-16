// Runs in Chromium: inspect visible text fragments, never parent/child container rectangles.
export function collectVisualData() {
  const root = document.querySelector('[data-presentation]')
  const texts = []
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  while (walker.nextNode()) {
    const node = walker.currentNode
    const parent = node.parentElement
    if (!node.textContent.trim() || parent.closest('[data-presentation-allow-overlap]')) continue
    const style = getComputedStyle(parent)
    if (style.visibility !== 'visible' || Number(style.opacity) === 0 || parent.closest('[aria-hidden="true"]')) continue
    if (!parent.checkVisibility({ opacityProperty: true, visibilityProperty: true })) continue
    const range = document.createRange()
    range.selectNodeContents(node)
    for (const r of range.getClientRects()) if (r.width && r.height) texts.push({ name: `${parent.closest('[data-entity-id]')?.getAttribute('data-entity-id') ?? parent.getAttribute('data-presentation-node') ?? parent.tagName}: ${node.textContent.trim().slice(0, 60)}`, x: r.x, y: r.y, width: r.width, height: r.height })
  }
  const signature = e => { const s = getComputedStyle(e); return [s.color, s.backgroundColor, s.fontWeight, s.borderColor, s.boxShadow, s.textDecorationLine].join('|') }
  const navigation = ['progress', 'toc'].flatMap(kind => {
    const controls = [...root.querySelectorAll(`[data-presentation-${kind}] [data-presentation-active]`)]
    const active = controls.find(e => e.getAttribute('data-presentation-active') === 'true')
    const inactive = controls.find(e => e.getAttribute('data-presentation-active') === 'false')
    return active && inactive ? [{ kind, active: signature(active), inactive: signature(inactive) }] : []
  })
  const link = root.querySelector('[data-presentation-attribution] a')
  const s = link && getComputedStyle(link)
  const attribution = s && { fontSize: parseFloat(s.fontSize), color: s.color, fontFamily: s.fontFamily, decoration: s.textDecorationLine, visible: link.checkVisibility({ opacityProperty: true, visibilityProperty: true }) }
  return { texts, navigation, attribution }
}
export function visualWarnings({ texts, navigation, attribution }) {
  const warnings = []
  for (let i = 0; i < texts.length; i++) for (let j = i + 1; j < texts.length; j++) {
    const a = texts[i], b = texts[j]
    if (Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x) > 1 && Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y) > 1) warnings.push(`overlap: ${a.name} <> ${b.name}`)
  }
  for (const n of navigation) if (n.active === n.inactive) warnings.push(`indistinct active ${n.kind}: style [data-presentation-active="true"]`)
  if (!attribution || !attribution.visible || attribution.fontSize < 11 || (/Times New Roman/i.test(attribution.fontFamily) && attribution.decoration.includes('underline')) || attribution.color === 'rgb(0, 0, 238)') warnings.push('attribution: missing, undersized, or browser-default; style [data-presentation-attribution]')
  return warnings
}
