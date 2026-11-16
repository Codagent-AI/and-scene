export function intersects(a, b) {
  return Math.min(a.right, b.right) - Math.max(a.left, b.left) > 2 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 2
}
function ownLabel(control, text) {
  return control.kind === 'chrome' && text.kind === 'text' && (control.key === text.key || text.ancestors.includes(control.key))
}
export function overlapWarnings(elements) {
  const warnings = []
  for (let i = 0; i < elements.length; i++) for (let j = i + 1; j < elements.length; j++) {
    const a = elements[i], b = elements[j]
    if (!a.visible || !b.visible || a.allowed || b.allowed) continue
    // Bounds and label text describe the same control, not two visible objects.
    // Keep every text/text comparison, including parent and descendant text.
    if (ownLabel(a, b) || ownLabel(b, a)) continue
    if (intersects(a.rect, b.rect)) warnings.push(`overlap: ${a.label} / ${b.label}`)
  }
  return warnings
}
export function chromeWarnings({ groups, attribution }) {
  const warnings = []
  for (const [name, group] of Object.entries(groups)) {
    if (group.active && group.inactive.some(signature => signature === group.active)) warnings.push(`indistinct active ${name}`)
  }
  if (!attribution || !attribution.visible || attribution.size < 12 || attribution.browserDefault) warnings.push('unpolished attribution: style [data-presentation-attribution] a (legible size, intentional link treatment)')
  return warnings
}
// Executed in Chromium: collect browser measurements without importing project code.
export function measurePage() {
  const all = [...document.querySelectorAll('body *')]
  const keys = new Map(all.map((el, i) => [el, String(i)]))
  const visible = el => {
    for (let parent = el; parent; parent = parent.parentElement) {
      const style = getComputedStyle(parent)
      if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) return false
    }
    const r = el.getBoundingClientRect()
    return r.width > 0 && r.height > 0 && r.right > 0 && r.bottom > 0 && r.left < innerWidth && r.top < innerHeight
  }
  const elements = []
  for (const el of all) {
    const ownText = [...el.childNodes].filter(n => n.nodeType === Node.TEXT_NODE && n.textContent.trim())
    const control = el.matches('button,a,input,select,textarea,summary')
    if ((!ownText.length && !control) || !visible(el)) continue
    const ancestors = []
    for (let parent = el.parentElement; parent; parent = parent.parentElement) ancestors.push(keys.get(parent))
    const measurements = ownText.flatMap(node => {
      const range = document.createRange()
      range.selectNodeContents(node)
      return [...range.getClientRects()].map(rect => ({ rect, kind: 'text', text: node.textContent.trim() }))
    })
    if (control) measurements.push({ rect: el.getBoundingClientRect(), kind: 'chrome', text: el.getAttribute('aria-label') || el.textContent.trim() })
    for (const { rect: r, kind, text } of measurements) elements.push({ key: keys.get(el), kind, label: `${el.tagName.toLowerCase()}${el.getAttribute('data-presentation-entity') ? `[${el.getAttribute('data-presentation-entity')}]` : ''} ${text.slice(0, 55)}`, ancestors, allowed: Boolean(el.closest('[data-presentation-allow-overlap]')), visible: true, rect: { left: r.left, top: r.top, right: r.right, bottom: r.bottom } })
  }
  const signature = el => {
    const s = getComputedStyle(el)
    return JSON.stringify([s.color, s.backgroundColor, s.backgroundImage, s.borderColor, s.borderWidth, s.borderStyle, s.boxShadow, s.fontWeight, s.fontSize, s.opacity, s.transform, s.textDecoration, s.outline])
  }
  const groups = {}
  for (const name of ['progress', 'toc-entry']) {
    const items = [...document.querySelectorAll(`[data-presentation-${name}]`)].filter(visible)
    const active = items.find(el => el.getAttribute('data-presentation-active') === 'true')
    const inactive = items.filter(el => el.getAttribute('data-presentation-active') !== 'true')
    groups[name] = { active: active && signature(active), inactive: inactive.map(signature) }
  }
  const link = document.querySelector('[data-presentation-attribution] a')
  const style = link && getComputedStyle(link)
  return { elements, groups, attribution: link && { visible: visible(link), size: parseFloat(style.fontSize), browserDefault: ['rgb(0, 0, 238)', 'rgb(85, 26, 139)'].includes(style.color) && style.textDecorationLine.includes('underline') } }
}
