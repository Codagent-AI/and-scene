export async function inspectWarnings(page) {
  return page.evaluate(() => {
    const root = document.querySelector('[data-presentation]')
    if (!root) return ['missing presentation root']
    const visible = [...root.querySelectorAll('*')].filter((el) => {
      const rect = el.getBoundingClientRect(), style = getComputedStyle(el)
      return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none' && el.innerText?.trim() && ![...el.children].some((child) => child.innerText?.trim())
    })
    const overlaps = []
    for (let a = 0; a < visible.length; a++) for (let b = a + 1; b < visible.length; b++) {
      const first = visible[a], second = visible[b]
      if (first.closest('[data-allow-overlap]') || second.closest('[data-allow-overlap]')) continue
      const x = first.getBoundingClientRect(), y = second.getBoundingClientRect()
      if (x.left < y.right && x.right > y.left && x.top < y.bottom && x.bottom > y.top) overlaps.push(`${first.getAttribute('data-scene-entity') || first.getAttribute('class') || first.tagName} / ${second.getAttribute('data-scene-entity') || second.getAttribute('class') || second.tagName}`)
    }
    const warnings = overlaps.length ? [`visible text/chrome overlap: ${[...new Set(overlaps)].join(', ')}`] : []
    const kinds = [['data-presentation-progress-item', 'active progress indicator may be visually indistinct from inactive indicators'], ['data-presentation-toc-item', 'active table-of-contents entry may be visually indistinct from inactive entries']]
    const look = (node) => { const style = getComputedStyle(node), rect = node.getBoundingClientRect(); return [style.color, style.backgroundColor, style.backgroundImage, style.fontWeight, style.opacity, style.boxShadow, style.textDecorationLine, style.transform, style.outlineStyle === 'none' ? '' : style.outlineColor, ['Top', 'Right', 'Bottom', 'Left'].map((side) => style[`border${side}Style`] === 'none' ? '' : `${style[`border${side}Width`]} ${style[`border${side}Color`]}`).join('|'), Math.round(rect.width), Math.round(rect.height)].join(';') }
    for (const [hook, message] of kinds) {
      const items = [...root.querySelectorAll(`[${hook}]`)].filter((node) => node.getBoundingClientRect().width > 0)
      const inactive = items.filter((node) => node.getAttribute('aria-current') === null)
      if (items.some((item) => item.getAttribute('aria-current') !== null && inactive.length && inactive.every((node) => look(node) === look(item)))) warnings.push(message)
    }
    const attribution = root.querySelector('[data-presentation-attribution]')
    if (!attribution) warnings.push('missing attribution')
    else {
      const style = getComputedStyle(attribution), rect = attribution.getBoundingClientRect()
      if (parseFloat(style.fontSize) < 12 || rect.height < 12 || (style.textDecorationLine.includes('underline') && style.color === 'rgb(0, 0, 238)')) warnings.push('attribution may be browser-default or undersized; style [data-presentation-attribution]')
    }
    return [...new Set(warnings)]
  })
}
