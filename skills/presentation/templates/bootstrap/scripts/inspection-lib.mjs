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
    if (element.children.length !== 0 || !element.textContent.trim() || ['arrow', 'frame'].includes(element.getAttribute('data-presentation-node'))) return false
    let ancestor = element
    while (ancestor && ancestor instanceof Element) {
      const style = getComputedStyle(ancestor)
      if (style.display === 'none' || style.visibility === 'hidden' || !(Number.parseFloat(style.opacity) > 0)) return false
      ancestor = ancestor.parentElement
    }
    const range = document.createRange()
    range.selectNodeContents(element)
    const rect = range.getBoundingClientRect()
    const elementRect = element.getBoundingClientRect()
    return elementRect.width > 0 && elementRect.height > 0 && rect.width > 0 && rect.height > 0 && rect.right > 0 && rect.bottom > 0 && rect.left < innerWidth && rect.top < innerHeight
  }).map((element) => {
    const range = document.createRange()
    range.selectNodeContents(element)
    const rect = range.getBoundingClientRect()
    return { label: element.getAttribute('data-presentation-label') || element.getAttribute('data-presentation-node') || element.getAttribute('data-presentation-caption') || element.tagName.toLowerCase(), text: element.textContent.trim(), allowed: allowed(element), rect: { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom } }
  })
  const overlaps = []
  for (let i = 0; i < visibleText.length; i++) for (let j = i + 1; j < visibleText.length; j++) {
    const a = visibleText[i], b = visibleText[j]
    if (a.allowed || b.allowed || a.rect.left >= b.rect.right || a.rect.right <= b.rect.left || a.rect.top >= b.rect.bottom || a.rect.bottom <= b.rect.top) continue
    overlaps.push({ first: a.label, second: b.label })
  }
  const active = [...document.querySelectorAll('[data-presentation-progress] [data-presentation-active="true"], [data-presentation-toc] [data-presentation-active="true"]')]
  const style = (el) => { const s = getComputedStyle(el); return { color: s.color, backgroundColor: s.backgroundColor, borderColor: s.borderColor, fontWeight: s.fontWeight, opacity: s.opacity, textDecorationLine: s.textDecorationLine } }
  const sameStyle = (a, b) => ['color', 'backgroundColor', 'borderColor', 'fontWeight', 'opacity', 'textDecorationLine'].every((key) => a[key] === b[key])
  const indistinct = active.some((item) => {
    const inactive = [...(item.parentElement?.querySelectorAll('button') || [])].find((candidate) => candidate !== item)
    return Boolean(inactive && sameStyle(style(item), style(inactive)))
  })
  const attribution = document.querySelector('[data-presentation-attribution]')
  let attributionInfo = null
  if (attribution) { const s = getComputedStyle(attribution); attributionInfo = { fontSize: parseFloat(s.fontSize), defaultLike: s.textDecorationLine.includes('underline') || s.color === 'rgb(0, 0, 238)' } }
  return { overlaps, indistinct: indistinct ? ['navigation'] : [], attribution: attributionInfo ? [ ...(attributionInfo.fontSize < 12 ? ['attribution is too small; style the [data-presentation-attribution] hook'] : []), ...(attributionInfo.defaultLike ? ['attribution looks browser-default; style the [data-presentation-attribution] hook'] : []) ] : ['attribution link is missing; style the [data-presentation-attribution] hook'] }
}
