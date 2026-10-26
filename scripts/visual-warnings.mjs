export function collectVisualWarnings() {
  const isVisible = (element) => {
    const style = getComputedStyle(element)
    const rect = element.getBoundingClientRect()
    return style.visibility !== 'hidden' &&
      style.display !== 'none' &&
      Number(style.opacity) > 0 &&
      rect.width > 0 &&
      rect.height > 0
  }
  const allowsOverlap = (element) => Boolean(element.closest('[data-presentation-allow-overlap]'))
  const overlaps = (first, second) => {
    const firstRect = first.getBoundingClientRect()
    const secondRect = second.getBoundingClientRect()
    return firstRect.left < secondRect.right &&
      firstRect.right > secondRect.left &&
      firstRect.top < secondRect.bottom &&
      firstRect.bottom > secondRect.top
  }
  const looksLikeSameActiveState = (active, inactive) => {
    const fields = ['color', 'backgroundColor', 'borderColor', 'fontWeight', 'opacity']
    return fields.every((field) => getComputedStyle(active)[field] === getComputedStyle(inactive)[field])
  }

  const visible = [...document.querySelectorAll('[data-presentation-root] *')].filter(isVisible)
  const text = visible.filter((element) => element.childElementCount === 0 && element.textContent?.trim())
  const chrome = visible.filter((element) => element.matches(
    '[data-presentation-caption], [data-presentation-progress-item], [data-presentation-controls] > button, [data-presentation-toc-item], [data-presentation-attribution]',
  ))
  const candidates = [...new Set([...text, ...chrome])]
  const warnings = new Set()

  for (let first = 0; first < candidates.length; first += 1) {
    for (let second = first + 1; second < candidates.length; second += 1) {
      const firstCandidate = candidates[first]
      const secondCandidate = candidates[second]
      if (
        firstCandidate.contains(secondCandidate) ||
        secondCandidate.contains(firstCandidate) ||
        allowsOverlap(firstCandidate) ||
        allowsOverlap(secondCandidate)
      ) continue
      if (overlaps(firstCandidate, secondCandidate)) {
        warnings.add(`${firstCandidate.tagName.toLowerCase()} overlaps ${secondCandidate.tagName.toLowerCase()}`)
      }
    }
  }

  const activeSelectors = [
    ['[data-presentation-progress-item]', 'progress'],
    ['[data-presentation-toc-item]', 'table-of-contents'],
  ]
  for (const [selector, label] of activeSelectors) {
    const active = document.querySelector(`${selector}[data-presentation-active]`)
    const inactive = document.querySelector(`${selector}:not([data-presentation-active])`)
    if (active && inactive && looksLikeSameActiveState(active, inactive)) {
      warnings.add(`active ${label} state may be visually indistinct`)
    }
  }

  const attribution = document.querySelector('[data-presentation-attribution]')
  if (!attribution) {
    warnings.add('missing attribution; style [data-presentation-attribution] locally')
  } else {
    const style = getComputedStyle(attribution)
    if (Number.parseFloat(style.fontSize) < 10 || style.color === 'rgb(0, 0, 238)') {
      warnings.add('attribution appears undersized or browser-default; style [data-presentation-attribution] locally')
    }
  }

  return [...warnings]
}
