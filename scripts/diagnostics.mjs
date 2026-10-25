// Pure decisions shared by DOM collection and unit tests. No visual-taste gate.
export function overlaps(a, b) {
  return a.x < b.x + b.width - 1 && a.x + a.width > b.x + 1 && a.y < b.y + b.height - 1 && a.y + a.height > b.y + 1
}
// A control's contained label is another measurement of that same control.
// Nested text/text pairs are always checked independently.
function ownLabel(surface, text) {
  return surface.kind === 'control' && text.kind === 'text' && text.control === surface.element &&
    text.x >= surface.x && text.y >= surface.y && text.x + text.width <= surface.x + surface.width && text.y + text.height <= surface.y + surface.height
}
export function collisionWarnings(items) {
  const warnings = []
  for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++) {
    const a = items[i], b = items[j]
    if (!a.visible || !b.visible || a.allowed || b.allowed) continue
    if (ownLabel(a, b) || ownLabel(b, a)) continue
    if (overlaps(a, b)) warnings.push(`overlap: ${a.label} <> ${b.label}`)
  }
  return warnings
}
export function indistinct(active, inactive) {
  return Boolean(active && inactive && JSON.stringify(active) === JSON.stringify(inactive))
}
export function attributionWarnings(attribution) {
  const hook = '[data-presentation-attribution]'
  if (!attribution?.visible) return [`attribution: missing or hidden; style ${hook}`]
  const warnings = []
  if (attribution.fontSize < 11) warnings.push(`attribution: undersized; style ${hook}`)
  if (attribution.color === 'rgb(0, 0, 238)' || attribution.color === 'rgb(85, 26, 139)' || (attribution.fontFamily.includes('Times New Roman') && attribution.textDecoration.includes('underline'))) warnings.push(`attribution: browser-default; style ${hook}`)
  return warnings
}
export function collectDiagnostics() {
  // Runs in the browser; return serializable geometry and computed style only.
  const host = document.querySelector('[data-presentation]')
  const visible = el => {
    const rect = el.getBoundingClientRect()
    if (!rect.width || !rect.height) return false
    for (let ancestor = el; ancestor; ancestor = ancestor.parentElement) {
      const style = getComputedStyle(ancestor)
      if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) return false
    }
    return true
  }
  const all = [...host.querySelectorAll('*')]
  const identify = el => all.indexOf(el)
  const controls = 'button,a,input,textarea,select,[role="button"],[role="slider"],[role="tab"],[data-presentation-progress-item],[data-presentation-toc-item]'
  const items = []
  const add = (el, rect, kind, label) => {
    if (!rect.width || !rect.height) return
    items.push({ element: identify(el), kind, control: identify(el.closest(controls)), label,
      visible: true, allowed: Boolean(el.closest('[data-presentation-allow-overlap]')),
      x: rect.x, y: rect.y, width: rect.width, height: rect.height })
  }
  for (const control of host.querySelectorAll(controls)) {
    if (visible(control)) add(control, control.getBoundingClientRect(), 'control', `control: ${control.getAttribute('aria-label') || control.textContent.trim() || control.tagName.toLowerCase()}`)
  }
  const walker = document.createTreeWalker(host, NodeFilter.SHOW_TEXT)
  while (walker.nextNode()) {
    const node = walker.currentNode, el = node.parentElement
    if (!node.textContent.trim() || !visible(el) || el.closest('[aria-hidden="true"]')) continue
    const range = document.createRange(); range.selectNodeContents(node)
    for (const rect of range.getClientRects()) add(el, rect, 'text', `${el.tagName.toLowerCase()}: ${node.textContent.trim().slice(0, 60)}`)
  }
  const fingerprint = el => {
    if (!el) return null
    const css = getComputedStyle(el)
    return Object.fromEntries(['color','backgroundColor','borderColor','fontWeight','textDecorationLine','boxShadow','opacity','outlineStyle'].map(key => [key, css[key]]))
  }
  const chrome = ['progress', 'toc'].flatMap(kind => {
    const elements = [...document.querySelectorAll(`[data-presentation-${kind}-item]`)].filter(visible)
    const active = elements.find(el => el.dataset.presentationActive === 'true')
    const inactive = elements.find(el => el.dataset.presentationActive === 'false')
    return active && inactive ? [{ kind, active: fingerprint(active), inactive: fingerprint(inactive) }] : []
  })
  const link = document.querySelector('[data-presentation-attribution]')
  const css = link ? getComputedStyle(link) : null
  const attribution = css ? { visible: visible(link), fontSize: parseFloat(css.fontSize), fontFamily: css.fontFamily, color: css.color, textDecoration: css.textDecorationLine } : null
  return { items, chrome, attribution }
}
export function diagnose(data) {
  return [...collisionWarnings(data.items), ...data.chrome.filter(item => indistinct(item.active, item.inactive)).map(item => `active chrome: indistinct ${item.kind}`), ...attributionWarnings(data.attribution)]
}
