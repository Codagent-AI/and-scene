export async function collectVisualWarnings(page) {
  return page.evaluate(() => {
    const visible = (element) => {
      const rect = element.getBoundingClientRect()
      const style = getComputedStyle(element)
      return rect.width > 1 && rect.height > 1 && style.visibility !== 'hidden' && style.display !== 'none' && Number(style.opacity) > 0.05
    }
    const textNodes = [...(document.querySelector('[data-presentation-root]') ?? document).querySelectorAll('*')]
      .filter((element) => element.children.length === 0 && element.textContent?.trim() && visible(element))
      .filter((element) => element.closest('[data-presentation-scene], [data-presentation-header], [data-presentation-footer], [data-presentation-toc]'))
      .map((element) => ({ element, label: element.textContent.trim().replace(/\s+/g, ' ').slice(0, 70) }))
    const warnings = []
    for (let a = 0; a < textNodes.length; a++) for (let b = a + 1; b < textNodes.length; b++) {
      const first = textNodes[a], second = textNodes[b]
      if (first.element.closest('[data-allow-overlap]') || second.element.closest('[data-allow-overlap]')) continue
      const x = first.element.getBoundingClientRect(), y = second.element.getBoundingClientRect()
      if (x.left < y.right && x.right > y.left && x.top < y.bottom && x.bottom > y.top) warnings.push(`text overlap: “${first.label}” / “${second.label}”`)
    }
    for (const [selector, label] of [['[data-presentation-progress-item][data-presentation-active="true"]', 'active progress'], ['[data-presentation-toc-item][data-presentation-active="true"]', 'active table of contents']]) {
      const active = document.querySelector(selector)
      if (!active) continue
      const siblingSelector = selector.replace('[data-presentation-active="true"]', '[data-presentation-active="false"]')
      const inactive = document.querySelector(siblingSelector)
      if (!inactive) continue
      const a = getComputedStyle(active), b = getComputedStyle(inactive)
      if (a.color === b.color && a.backgroundColor === b.backgroundColor && a.borderColor === b.borderColor && a.fontWeight === b.fontWeight) warnings.push(`${label} state may be visually indistinct`)
    }
    const attribution = document.querySelector('[data-presentation-attribution]')
    if (!attribution) warnings.push('missing attribution; style [data-presentation-attribution]')
    else {
      const style = getComputedStyle(attribution)
      if (parseFloat(style.fontSize) < 11 || style.textDecorationLine.includes('underline') || style.fontFamily === '"Times New Roman"') warnings.push('attribution may be browser-default or undersized; style [data-presentation-attribution]')
    }
    return warnings
  })
}
