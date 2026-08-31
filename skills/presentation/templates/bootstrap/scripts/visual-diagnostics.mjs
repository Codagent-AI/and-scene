export function collectVisualWarnings() {
  const relevantSelector = [
    '[data-presentation-caption]',
    '[data-presentation-marker]',
    '[data-presentation-title]',
    '[data-presentation-present-title]',
    '[data-presentation-mode-toggle]',
    '[data-presentation-toc-entry]',
    '[data-presentation-progress-item]',
    '[data-presentation-controls] button',
    '[data-presentation-node]',
    '[data-presentation-attribution]',
  ].join(', ')
  const activeChromeSelectors = [
    '[data-presentation-progress-item]',
    '[data-presentation-toc-entry]',
  ]
  const warnings = []
  const root = document.querySelector('[data-presentation-root]')
  const elements = root ? [...root.querySelectorAll('*')].filter(isRelevantVisibleElement) : []

  for (let firstIndex = 0; firstIndex < elements.length; firstIndex += 1) {
    for (let secondIndex = firstIndex + 1; secondIndex < elements.length; secondIndex += 1) {
      const first = elements[firstIndex]
      const second = elements[secondIndex]
      if (isNestedOrAllowed(first, second)) continue
      if (rectsIntersect(first.getBoundingClientRect(), second.getBoundingClientRect())) {
        warnings.push(`overlap: ${first.tagName.toLowerCase()} and ${second.tagName.toLowerCase()}`)
      }
    }
  }

  for (const selector of activeChromeSelectors) {
    const active = document.querySelector(`${selector}[data-presentation-active="true"]`)
    const inactive = document.querySelector(`${selector}[data-presentation-active="false"]`)
    if (active && inactive && stylesMatch(getComputedStyle(active), getComputedStyle(inactive))) {
      warnings.push(`indistinct active chrome: ${selector}`)
    }
  }

  const attribution = document.querySelector('[data-presentation-attribution]')
  if (!attribution) {
    warnings.push('missing attribution: style [data-presentation-attribution] locally')
  } else if (isUnpolishedAttribution(getComputedStyle(attribution))) {
    warnings.push('unpolished attribution: style [data-presentation-attribution] locally')
  }

  return [...new Set(warnings)]

  function isRelevantVisibleElement(element) {
    const hasDirectText = [...element.childNodes].some((node) => node.nodeType === 3 && node.textContent?.trim())
    if (!element.matches(relevantSelector) && !hasDirectText) return false

    const style = getComputedStyle(element)
    const box = element.getBoundingClientRect()
    return style.display !== 'none'
      && style.visibility !== 'hidden'
      && Number(style.opacity) > 0
      && box.width > 0
      && box.height > 0
  }

  function isNestedOrAllowed(first, second) {
    return first.contains(second)
      || second.contains(first)
      || Boolean(first.closest('[data-presentation-allow-overlap]'))
      || Boolean(second.closest('[data-presentation-allow-overlap]'))
  }

  function rectsIntersect(first, second) {
    return first.left < second.right
      && first.right > second.left
      && first.top < second.bottom
      && first.bottom > second.top
  }

  function stylesMatch(first, second) {
    return first.color === second.color
      && first.backgroundColor === second.backgroundColor
      && first.borderColor === second.borderColor
      && first.opacity === second.opacity
  }

  function isUnpolishedAttribution(style) {
    return Number.parseFloat(style.fontSize) < 12
      || style.color === 'rgb(0, 0, 238)'
      || style.textDecorationLine.includes('underline')
  }
}
