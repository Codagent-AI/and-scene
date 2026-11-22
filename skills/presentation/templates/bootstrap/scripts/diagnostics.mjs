export function overlaps(a, b) {
  return (
    Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1 &&
    Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1
  )
}
export function diagnose({ texts, navigation, attribution }, step) {
  const warnings = []
  for (let i = 0; i < texts.length; i++) {
    for (let j = i + 1; j < texts.length; j++) {
      const a = texts[i]
      const b = texts[j]
      if (
        a.visible &&
        b.visible &&
        !a.allowed &&
        !b.allowed &&
        overlaps(a.rect, b.rect)
      )
        warnings.push(`step ${step}: overlap ${a.name} / ${b.name}`)
    }
  }
  for (const group of navigation) {
    if (group.active && group.inactive.includes(group.active))
      warnings.push(`step ${step}: indistinct active ${group.name}`)
  }
  if (
    !attribution ||
    !attribution.visible ||
    attribution.fontSize < 11 ||
    attribution.browserDefault
  )
    warnings.push(
      `step ${step}: style [data-presentation-attribution] for legible attribution`,
    )
  return warnings
}
// Runs in the page so geometry and computed styles reflect the production browser.
export function collectDiagnostics() {
  const visible = (element) => {
    const style = getComputedStyle(element)
    const rect = element.getBoundingClientRect()
    return (
      element.checkVisibility({
        checkOpacity: true,
        checkVisibilityCSS: true,
      }) &&
      style.display !== 'none' &&
      rect.width > 0 &&
      rect.height > 0
    )
  }
  const describe = (element) =>
    element.getAttribute('data-presentation-entity') ||
    element.getAttribute('aria-label') ||
    element.tagName.toLowerCase()
  const chromeSelector =
    '[data-presentation-progress-entry], [data-presentation-toc-entry], [data-presentation-mode-toggle], [data-presentation-prev], [data-presentation-next], [data-presentation-attribution], [data-presentation-caption], [data-presentation-title], [data-presentation-marker]'
  const texts = [...document.querySelectorAll(chromeSelector)].map(
    (element) => {
      const rect = element.getBoundingClientRect()
      return {
        name: describe(element),
        visible: visible(element),
        allowed: Boolean(element.closest('[data-presentation-allow-overlap]')),
        rect: {
          left: rect.left,
          right: rect.right,
          top: rect.top,
          bottom: rect.bottom,
        },
      }
    },
  )
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
  while (walker.nextNode()) {
    const node = walker.currentNode
    const parent = node.parentElement
    if (
      !node.textContent.trim() ||
      !parent ||
      parent.closest(chromeSelector) ||
      ['STYLE', 'SCRIPT'].includes(parent.tagName)
    )
      continue
    const range = document.createRange()
    range.selectNodeContents(node)
    for (const rect of range.getClientRects()) {
      texts.push({
        name: `${describe(parent)} (${node.textContent.trim().slice(0, 40)})`,
        visible: visible(parent),
        allowed: Boolean(parent.closest('[data-presentation-allow-overlap]')),
        rect: {
          left: rect.left,
          right: rect.right,
          top: rect.top,
          bottom: rect.bottom,
        },
      })
    }
  }
  const signature = (element) => {
    const s = getComputedStyle(element)
    return [
      s.color,
      s.backgroundColor,
      s.borderColor,
      s.borderWidth,
      s.fontWeight,
      s.opacity,
      s.boxShadow,
      s.textDecoration,
      s.outline,
      s.transform,
    ].join('|')
  }
  const navigation = ['progress', 'toc'].map((name) => {
    const entries = [
      ...document.querySelectorAll(`[data-presentation-${name}-entry]`),
    ].filter(visible)
    return {
      name,
      active:
        entries.find(
          (element) =>
            element.getAttribute('data-presentation-active') === 'true',
        ) &&
        signature(
          entries.find(
            (element) =>
              element.getAttribute('data-presentation-active') === 'true',
          ),
        ),
      inactive: entries
        .filter(
          (element) =>
            element.getAttribute('data-presentation-active') !== 'true',
        )
        .map(signature),
    }
  })
  const link = document.querySelector('[data-presentation-attribution]')
  let attribution = null
  if (link) {
    const style = getComputedStyle(link)
    attribution = {
      visible: visible(link),
      fontSize: parseFloat(style.fontSize),
      browserDefault:
        ['rgb(0, 0, 238)', 'rgb(85, 26, 139)'].includes(style.color) &&
        style.textDecorationLine.includes('underline'),
    }
  }
  return { texts, navigation, attribution }
}
