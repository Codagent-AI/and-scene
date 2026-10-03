/** Run in the inspected page context and return advisory visual diagnostics. */
export function inspectWarnings() {
  const result = []
  const visible = element => {
    const rect = element.getBoundingClientRect(), style = getComputedStyle(element)
    return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) > 0
  }
  const name = element => element.getAttribute('aria-label') || element.getAttribute('data-presentation-node') || element.className?.baseVal || element.className || element.tagName.toLowerCase()
  const textRect = element => { const range = document.createRange(); range.selectNodeContents(element); return range.getBoundingClientRect() }
  const textLeaves = [...document.querySelectorAll('[data-presentation-canvas] *, [data-presentation-header] *, [data-presentation-toc] *, [data-presentation-footer] *')]
    .filter(element => visible(element) && element.children.length === 0 && element.textContent?.trim())
  const textNodes = textLeaves.filter(element => !element.closest('[data-presentation-allow-overlap]'))
  const rects = textNodes.map(textRect)
  for (let i = 0; i < textNodes.length; i += 1) {
    const a = textNodes[i], ar = rects[i]
    for (let j = i + 1; j < textNodes.length; j += 1) {
      const b = textNodes[j]
      if (a === b || a.contains(b) || b.contains(a)) continue
      const br = rects[j]
      if (ar.width > 0 && ar.height > 0 && br.width > 0 && br.height > 0 && ar.left < br.right - 3 && ar.right > br.left + 3 && ar.top < br.bottom - 3 && ar.bottom > br.top + 3) result.push(`text/chrome overlap: ${name(a)} with ${name(b)}`)
    }
  }
  const compare = (selector, warning) => {
    const active = document.querySelector(selector + '[data-presentation-active="true"]')
    const inactive = document.querySelector(selector + ':not([data-presentation-active])')
    if (active && inactive) {
      const a = getComputedStyle(active), b = getComputedStyle(inactive)
      if (a.color === b.color && a.backgroundColor === b.backgroundColor && a.borderColor === b.borderColor && a.fontWeight === b.fontWeight) result.push(warning)
    }
  }
  compare('[data-presentation-progress]', 'active progress state is visually indistinct')
  compare('[data-presentation-toc-entry]', 'active table-of-contents state is visually indistinct')
  const attribution = document.querySelector('[data-presentation-attribution]')
  if (!attribution) result.push('attribution is missing')
  else { const s = getComputedStyle(attribution); if (Number.parseFloat(s.fontSize) < 12 || s.color === 'rgb(0, 0, 238)' || s.textDecorationLine.includes('underline')) result.push('attribution appears browser-default or undersized; style [data-presentation-attribution]') }
  return [...new Set(result)]
}
