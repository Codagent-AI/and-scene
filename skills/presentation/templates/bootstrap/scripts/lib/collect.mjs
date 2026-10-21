/* global document, getComputedStyle */
// Runs inside the page (via page.evaluate): gathers plain data for diagnostics.
// Must stay self-contained — it is serialized, so it cannot reference imports.
export function collectPageData() {
  const CHROME = [
    '[data-presentation-progress-dot]',
    '[data-presentation-toc-entry]',
    '[data-presentation-prev]',
    '[data-presentation-next]',
    '[data-presentation-attribution]',
  ].join(',')
  const isVisible = (el) => {
    const style = getComputedStyle(el)
    return style.visibility !== 'hidden' && style.display !== 'none' && Number(style.opacity) > 0
  }
  const hasOwnText = (el) => Array.from(el.childNodes).some((n) => n.nodeType === 3 && n.textContent.trim() !== '')
  const all = Array.from(document.querySelectorAll('body *')).filter((el) => {
    if (el.closest('svg')) return false
    return el.matches(CHROME) || hasOwnText(el)
  })
  const ids = new Map(all.map((el, i) => [el, i]))
  const items = all.filter(isVisible).map((el) => {
    const r = el.getBoundingClientRect()
    const ancestors = []
    for (let p = el.parentElement; p; p = p.parentElement) if (ids.has(p)) ancestors.push(ids.get(p))
    const text = (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40)
    const hook = Array.from(el.attributes).find((a) => a.name.startsWith('data-presentation-') && a.value === '')?.name
    return {
      id: ids.get(el),
      label: `${hook ? `[${hook}]` : el.tagName.toLowerCase()}${text ? ` "${text}"` : ''}`,
      rect: { x: r.x, y: r.y, width: r.width, height: r.height },
      allowOverlap: el.closest('[data-presentation-allow-overlap]') !== null,
      ancestors,
    }
  })
  const pick = (el) => {
    const s = getComputedStyle(el)
    return {
      color: s.color, backgroundColor: s.backgroundColor, borderTopColor: s.borderTopColor,
      borderTopWidth: s.borderTopWidth, outlineStyle: s.outlineStyle, outlineColor: s.outlineColor,
      opacity: s.opacity, fontWeight: s.fontWeight, textDecorationLine: s.textDecorationLine,
      transform: s.transform, boxShadow: s.boxShadow,
      // Text-bearing controls differ in size just because their labels do.
      width: el.textContent.trim() === '' ? s.width : '', height: el.textContent.trim() === '' ? s.height : '',
    }
  }
  const group = (name, selector) => ({
    name,
    controls: Array.from(document.querySelectorAll(selector)).map((el) => ({
      active: el.getAttribute('data-presentation-active') === 'true' || el.hasAttribute('aria-current'),
      style: pick(el),
    })),
  })
  const attributionEl = document.querySelector('[data-presentation-attribution]')
  let attribution = null
  if (attributionEl) {
    const s = getComputedStyle(attributionEl)
    const r = attributionEl.getBoundingClientRect()
    attribution = { fontSize: parseFloat(s.fontSize), color: s.color, width: r.width, height: r.height }
  }
  return {
    items,
    activeGroups: [group('progress indicator', '[data-presentation-progress-dot]'), group('table-of-contents entry', '[data-presentation-toc-entry]')],
    attribution,
    index: document.querySelector('[data-step-index]')?.getAttribute('data-step-index') ?? null,
    title: document.querySelector('[data-presentation-title]')?.textContent ?? null,
  }
}
