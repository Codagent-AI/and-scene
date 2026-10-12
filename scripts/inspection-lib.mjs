export function overlaps(a, b) {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top
}
export function findOverlaps(elements) {
  const warnings = []
  for (let i = 0; i < elements.length; i++) for (let j = i + 1; j < elements.length; j++) {
    const a = elements[i], b = elements[j]
    if (a.allowed || b.allowed || !a.text || !b.text || !overlaps(a.rect, b.rect)) continue
    warnings.push({ first: a.label, second: b.label })
  }
  return warnings
}
export function stylesIndistinguishable(active, inactive) {
  const keys = ['color', 'backgroundColor', 'borderColor', 'fontWeight', 'opacity', 'textDecorationLine']
  return keys.every((key) => active[key] === inactive[key])
}
export function attributionWarnings(info) {
  if (!info) return ['attribution link is missing; style the [data-presentation-attribution] hook']
  const warnings = []
  if (info.fontSize < 12) warnings.push('attribution is too small; style the [data-presentation-attribution] hook')
  if (info.defaultLike) warnings.push('attribution looks browser-default; style the [data-presentation-attribution] hook')
  return warnings
}
export function inspectDocument() {
  const allowed = (element) => Boolean(element.closest('[data-presentation-allow-overlap]'))
  const visibleText = [...document.querySelectorAll('body *')].filter((element) => {
    const style = getComputedStyle(element), rect = element.getBoundingClientRect()
    return element.children.length === 0 && element.textContent.trim() && style.visibility !== 'hidden' && style.display !== 'none' && rect.width > 0 && rect.height > 0
  }).map((element) => { const r = element.getBoundingClientRect(); return { label: element.getAttribute('data-presentation-node') || element.getAttribute('data-presentation-caption') || element.tagName.toLowerCase(), text: element.textContent.trim(), allowed: allowed(element), rect: { left: r.left, right: r.right, top: r.top, bottom: r.bottom } } })
  const active = [...document.querySelectorAll('[data-presentation-progress] [data-presentation-active="true"], [data-presentation-toc] [data-presentation-active="true"]')]
  const inactive = active.map((item) => item.parentElement?.querySelector('[data-presentation-active]') === item ? [...item.parentElement.querySelectorAll('button')].find((candidate) => candidate !== item) : null).filter(Boolean)
  const style = (el) => { const s = getComputedStyle(el); return { color: s.color, backgroundColor: s.backgroundColor, borderColor: s.borderColor, fontWeight: s.fontWeight, opacity: s.opacity, textDecorationLine: s.textDecorationLine } }
  const attribution = document.querySelector('[data-presentation-attribution]')
  let attributionInfo = null
  if (attribution) { const s = getComputedStyle(attribution); attributionInfo = { fontSize: parseFloat(s.fontSize), defaultLike: s.textDecorationLine.includes('underline') || s.color === 'rgb(0, 0, 238)' } }
  return { overlaps: findOverlaps(visibleText), indistinct: active.flatMap((item, i) => inactive[i] && stylesIndistinguishable(style(item), style(inactive[i])) ? [item.closest('nav')?.getAttribute('aria-label') || 'navigation'] : []), attribution: attributionWarnings(attributionInfo) }
}
