// Runs in Chromium: text fragments plus chrome hit areas, without container/child duplicates.
export function collectVisualData() {
  const root = document.querySelector('[data-presentation]')
  const eligible = e => {
    const s = getComputedStyle(e)
    return !e.closest('[data-presentation-allow-overlap],[aria-hidden="true"]') && s.visibility === 'visible' && s.opacity !== '0' && e.checkVisibility({ opacityProperty: true, visibilityProperty: true })
  }
  const chromeSelector = 'button,a,input,select,textarea,summary,[role="button"],[data-presentation-control]'
  const chromeRoots = '[data-presentation-header],[data-presentation-footer],[data-presentation-toc],[data-presentation-attribution]'
  const controls = [...root.querySelectorAll(chromeSelector)].filter(e => e.closest(chromeRoots) && eligible(e))
  const owner = e => {
    const control = e.closest(chromeSelector)
    const index = controls.indexOf(control)
    return index === -1 ? null : `control-${index}`
  }
  const chrome = controls.flatMap(e => {
    const r = e.getBoundingClientRect()
    return r.width && r.height ? [{ kind: 'chrome', owner: owner(e), name: `chrome:${e.tagName.toLowerCase()} ${e.getAttribute('aria-label') ?? e.textContent.trim().slice(0, 60)}`, x: r.x, y: r.y, width: r.width, height: r.height }] : []
  })
  const texts = []
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  while (walker.nextNode()) {
    const node = walker.currentNode
    const parent = node.parentElement
    if (!node.textContent.trim() || !eligible(parent)) continue
    const range = document.createRange()
    range.selectNodeContents(node)
    for (const r of range.getClientRects()) if (r.width && r.height) texts.push({ kind: 'text', owner: owner(parent), name: `${parent.closest('[data-entity-id]')?.getAttribute('data-entity-id') ?? parent.getAttribute('data-presentation-node') ?? parent.tagName}: ${node.textContent.trim().slice(0, 60)}`, x: r.x, y: r.y, width: r.width, height: r.height })
  }
  const appearance = e => {
    const s = getComputedStyle(e)
    return {
      color: s.color, background: s.backgroundColor, image: s.backgroundImage, weight: s.fontWeight,
      font: s.fontFamily, size: s.fontSize, spacing: s.letterSpacing, shadow: s.boxShadow, decoration: s.textDecorationLine,
      borders: ['Top', 'Right', 'Bottom', 'Left'].map(side => ({ width: parseFloat(s[`border${side}Width`]), style: s[`border${side}Style`], color: s[`border${side}Color`] })),
      outline: { width: parseFloat(s.outlineWidth), style: s.outlineStyle, color: s.outlineColor },
    }
  }
  const navigation = ['progress', 'toc'].flatMap(kind => {
    const entries = [...root.querySelectorAll(`[data-presentation-${kind}] [data-presentation-active]`)]
    const active = entries.find(e => e.getAttribute('data-presentation-active') === 'true')
    const inactive = entries.find(e => e.getAttribute('data-presentation-active') === 'false')
    return active && inactive ? [{ kind, active: appearance(active), inactive: appearance(inactive) }] : []
  })
  const link = root.querySelector('[data-presentation-attribution] a')
  const s = link && getComputedStyle(link)
  const attribution = s && { fontSize: parseFloat(s.fontSize), color: s.color, fontFamily: s.fontFamily, decoration: s.textDecorationLine, visible: link.checkVisibility({ opacityProperty: true, visibilityProperty: true }) }
  return { texts, chrome, navigation, attribution }
}
export function visibleStyleSignature(style) {
  const stroke = s => s?.width > 0 && !['none', 'hidden'].includes(s.style) && s.color !== 'transparent' && !/rgba\([^)]*,\s*0\)$/.test(s.color) ? [s.width, s.style, s.color] : null
  const { borders = [], outline, ...rest } = style
  return JSON.stringify({ ...rest, borders: borders.map(stroke), outline: stroke(outline) })
}
export function visualWarnings({ texts, chrome = [], navigation, attribution }) {
  const warnings = []
  const elements = [...texts, ...chrome]
  for (let i = 0; i < elements.length; i++) for (let j = i + 1; j < elements.length; j++) {
    const a = elements[i], b = elements[j]
    // A control's label naturally occupies its own hit area; unrelated text still collides.
    if ((a.kind === 'chrome' || b.kind === 'chrome') && a.owner && a.owner === b.owner) continue
    if (Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x) > 1 && Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y) > 1) warnings.push(`overlap: ${a.name} <> ${b.name}`)
  }
  for (const n of navigation) if (visibleStyleSignature(n.active) === visibleStyleSignature(n.inactive)) warnings.push(`indistinct active ${n.kind}: style [data-presentation-active="true"]`)
  if (!attribution || !attribution.visible || attribution.fontSize < 11 || (/Times New Roman/i.test(attribution.fontFamily) && attribution.decoration.includes('underline')) || attribution.color === 'rgb(0, 0, 238)') warnings.push('attribution: missing, undersized, or browser-default; style [data-presentation-attribution]')
  return warnings
}
