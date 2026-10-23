/**
 * Runs inside the page through `page.evaluate`, so it must stay self-contained:
 * it cannot reference imports or module-level names. It gathers the geometry and
 * computed styles that the pure rules in diagnostics.mjs judge.
 */
export function collectPageDiagnostics() {
  const root = document.querySelector('[data-presentation-root]')
  if (!root) return null

  const styleSnapshot = (el) => {
    const cs = getComputedStyle(el)
    return {
      color: cs.color,
      backgroundColor: cs.backgroundColor,
      borderColor: cs.borderTopColor,
      borderWidth: cs.borderTopWidth,
      fontWeight: cs.fontWeight,
      transform: cs.transform,
      textDecorationLine: cs.textDecorationLine,
      boxShadow: cs.boxShadow,
    }
  }
  const isVisible = (el) => {
    const rect = el.getBoundingClientRect()
    const cs = getComputedStyle(el)
    return rect.width > 0 && rect.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none'
  }
  const ownText = (el) =>
    Array.from(el.childNodes).some((node) => node.nodeType === Node.TEXT_NODE && node.textContent.trim() !== '')

  const elements = Array.from(root.querySelectorAll('*')).filter(
    (el) => ownText(el) && isVisible(el) && el.closest('[data-presentation-allow-overlap]') === null,
  )
  const items = elements.map((el, idx) => {
    const rect = el.getBoundingClientRect()
    const text = el.textContent.trim().replace(/\s+/g, ' ').slice(0, 24)
    return {
      idx,
      label: el.getAttribute('data-presentation-entity') || `${el.tagName.toLowerCase()} "${text}"`,
      rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
      ancestors: [],
    }
  })
  items.forEach((item, i) => {
    items.forEach((other, j) => {
      if (i !== j && elements[j].contains(elements[i])) item.ancestors.push(other.idx)
    })
  })

  const activeDot = root.querySelector('[data-presentation-progress][data-presentation-active="true"]')
  const inactiveDot = root.querySelector('[data-presentation-progress]:not([data-presentation-active])')
  const activeEntry = root.querySelector('[data-presentation-toc-entry][data-presentation-active="true"]')
  const inactiveEntry = root.querySelector('[data-presentation-toc-entry]:not([data-presentation-active])')
  const attribution = root.querySelector('[data-presentation-attribution]')

  return {
    items,
    progress: activeDot && inactiveDot ? { active: styleSnapshot(activeDot), inactive: styleSnapshot(inactiveDot) } : null,
    toc: activeEntry && inactiveEntry ? { active: styleSnapshot(activeEntry), inactive: styleSnapshot(inactiveEntry) } : null,
    attribution: attribution
      ? { present: true, fontSizePx: parseFloat(getComputedStyle(attribution).fontSize), color: getComputedStyle(attribution).color }
      : { present: false, fontSizePx: 0, color: '' },
  }
}
