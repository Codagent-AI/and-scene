const diagnosticSelectors = [
  '[data-presentation-header]',
  '[data-presentation-footer]',
  '[data-presentation-toc]',
  '[data-presentation-caption]',
  '[data-presentation-title]',
  '[data-scene-node]',
]

function hasVisibleText(element) {
  const rect = element.getBoundingClientRect()
  return Boolean(element.textContent?.trim()) && rect.width > 0 && rect.height > 0
}

function rectsOverlap(first, second) {
  return first.left < second.right && first.right > second.left && first.top < second.bottom && first.bottom > second.top
}

function styleSignature(element, getStyle) {
  const style = getStyle(element)
  return `${style.color}|${style.backgroundColor}|${style.fontWeight}|${style.opacity}|${style.borderColor}`
}

export function collectVisualWarnings(document) {
  const getStyle = (element) => document.defaultView?.getComputedStyle(element) ?? {}
  const elements = [...document.querySelectorAll(diagnosticSelectors.join(','))]
    .filter(hasVisibleText)
    .map((element) => {
      const rect = element.getBoundingClientRect()
      return {
        element,
        label: element.getAttribute('data-scene-entity') ?? element.getAttribute('data-scene-node') ?? (element.className || element.tagName),
        rect: { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom },
        allowed: Boolean(element.closest('[data-presentation-allow-overlap]')),
      }
    })
  const warnings = []

  for (let first = 0; first < elements.length; first += 1) {
    for (let second = first + 1; second < elements.length; second += 1) {
      if (elements[first].allowed || elements[second].allowed) continue
      if (elements[first].element.contains(elements[second].element) || elements[second].element.contains(elements[first].element)) continue
      if (rectsOverlap(elements[first].rect, elements[second].rect)) {
        warnings.push(`text/chrome overlap: ${elements[first].label} ↔ ${elements[second].label}`)
      }
    }
  }

  const active = [...document.querySelectorAll('[data-presentation-progress-item][aria-current="step"], [data-presentation-toc-item][aria-current="step"]')]
  const inactive = [...document.querySelectorAll('[data-presentation-progress-item]:not([aria-current="step"]), [data-presentation-toc-item]:not([aria-current="step"])')]
  if (active.length && inactive.length && active.every((element) => styleSignature(element, getStyle) === styleSignature(inactive[0], getStyle))) {
    warnings.push('active navigation may be visually indistinct')
  }

  const attribution = document.querySelector('[data-presentation-attribution]')
  if (!attribution) {
    warnings.push('missing [data-presentation-attribution] attribution')
  } else {
    const link = attribution.querySelector('a')
    const style = getStyle(attribution)
    if (!link) warnings.push('attribution is not a link')
    const fontSize = Number.parseFloat(style.fontSize)
    if (!Number.isFinite(fontSize) || fontSize < 10) {
      warnings.push('attribution is undersized; style [data-presentation-attribution] locally')
    }
    const linkStyle = link ? getStyle(link) : style
    if (link && (!linkStyle.color || linkStyle.color === 'rgb(0, 0, 238)' || linkStyle.textDecorationLine.includes('underline'))) {
      warnings.push('attribution still looks browser-default; style [data-presentation-attribution] locally')
    }
  }

  return warnings
}
