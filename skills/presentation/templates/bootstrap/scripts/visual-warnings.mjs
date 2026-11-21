// This function runs inside the inspected page. Keep all DOM helpers local.
export function visualWarnings(root) {
  const warnings = []
  const chromeSelector = [
    '[data-presentation-toc-entry]', '[data-presentation-progress-step]',
    '[data-presentation-previous]', '[data-presentation-next]', '[data-presentation-attribution]',
  ].join(',')
  const allowSelector = '[data-presentation-allow-overlap]'

  function visible(element) {
    if (!element?.getClientRects().length) return false
    if (typeof element.checkVisibility === 'function') {
      return element.checkVisibility({ opacityProperty: true, visibilityProperty: true })
    }
    return getComputedStyle(element).visibility === 'visible'
  }

  function label(element) {
    const value = element.getAttribute('aria-label') || element.textContent.trim()
    return JSON.stringify(value.replace(/\s+/g, ' ').slice(0, 70))
  }

  function area(rect, element) {
    const left = Math.max(0, rect.left)
    const top = Math.max(0, rect.top)
    const right = Math.min(innerWidth, rect.right)
    const bottom = Math.min(innerHeight, rect.bottom)
    return right > left && bottom > top ? { left, top, right, bottom, element } : null
  }

  const areas = []
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  for (let text = walker.nextNode(); text; text = walker.nextNode()) {
    const element = text.parentElement
    if (!text.textContent.trim() || !visible(element) || element.closest(chromeSelector)) continue
    const range = document.createRange()
    range.selectNodeContents(text)
    for (const rect of range.getClientRects()) {
      const box = area(rect, element)
      if (box) areas.push(box)
    }
  }
  for (const element of root.querySelectorAll(chromeSelector)) {
    if (!visible(element)) continue
    const box = area(element.getBoundingClientRect(), element)
    if (box) areas.push(box)
  }

  for (const [index, a] of areas.entries()) {
    for (const b of areas.slice(index + 1)) {
      if (a.element.contains(b.element) || b.element.contains(a.element)) continue
      const marked = a.element.closest(allowSelector)
      if (marked?.contains(b.element)) continue
      if (Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1 &&
          Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1) {
        warnings.push(`overlap between ${label(a.element)} and ${label(b.element)}`)
      }
    }
  }

  const visualProperties = [
    'backgroundColor', 'backgroundImage', 'color', 'fontSize', 'fontWeight', 'fontStyle',
    'borderTopColor', 'borderRightColor', 'borderBottomColor', 'borderLeftColor',
    'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth',
    'boxShadow', 'outlineWidth', 'outlineColor', 'textDecorationLine', 'opacity', 'transform',
  ]
  function appearance(element) {
    const style = getComputedStyle(element)
    return visualProperties.map(property => style[property]).join('|')
  }
  for (const [hook, name] of [['progress-step', 'progress indicator'], ['toc-entry', 'table of contents entry']]) {
    const controls = [...root.querySelectorAll(`[data-presentation-${hook}]`)].filter(visible)
    for (const active of controls.filter(item => item.dataset.presentationActive === 'true')) {
      if (controls.some(item => item.dataset.presentationActive !== 'true' && appearance(item) === appearance(active))) {
        warnings.push(`indistinct active ${name} ${label(active)}`)
      }
    }
  }

  const attribution = root.querySelector('[data-presentation-attribution]')
  if (!visible(attribution)) {
    warnings.push('missing visible attribution; style [data-presentation-attribution]')
  } else {
    const style = getComputedStyle(attribution)
    const probe = document.createElement('a')
    probe.href = '#'
    probe.style.all = 'revert'
    probe.style.position = 'absolute'
    probe.style.visibility = 'hidden'
    root.append(probe)
    const browserColor = getComputedStyle(probe).color
    probe.remove()
    if (parseFloat(style.fontSize) < 11 ||
        (style.color === browserColor && style.textDecorationLine === 'underline')) {
      warnings.push('undersized or browser-default attribution; style [data-presentation-attribution]')
    }
  }

  return [...new Set(warnings)]
}
