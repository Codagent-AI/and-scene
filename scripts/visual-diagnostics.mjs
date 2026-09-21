// Advisory visual-composition diagnostics, evaluated inside the browser page.
// Kept dependency- and closure-free so it can be passed straight to page.evaluate().
export function collectVisualDiagnostics() {
  const result = []

  const activeState = (label, activeSelector, inactiveSelector) => {
    const active = document.querySelector(activeSelector)
    const inactive = document.querySelector(inactiveSelector)
    if (!active || !inactive) return
    const activeStyle = getComputedStyle(active)
    const inactiveStyle = getComputedStyle(inactive)
    if (
      activeStyle.backgroundColor === inactiveStyle.backgroundColor &&
      activeStyle.color === inactiveStyle.color &&
      activeStyle.borderColor === inactiveStyle.borderColor &&
      activeStyle.opacity === inactiveStyle.opacity &&
      activeStyle.fontWeight === inactiveStyle.fontWeight
    ) result.push(`active ${label} may be visually indistinct`)
  }

  activeState('progress', '[data-presentation-progress-item="active"]', '[data-presentation-progress] button:not([data-presentation-progress-item="active"])')
  activeState('table-of-contents entry', '[data-presentation-toc-item="active"]', '[data-presentation-toc] button:not([data-presentation-toc-item="active"])')

  const attribution = document.querySelector('[data-presentation-attribution]')
  if (!attribution || parseFloat(getComputedStyle(attribution).fontSize) < 11) result.push('attribution is missing or undersized; style [data-presentation-attribution]')

  const nodes = [...document.querySelectorAll('[data-presentation-label],[data-presentation-box],[data-presentation-caption],[data-presentation-title],[data-presentation-present-title]')].filter((node) => {
    const rect = node.getBoundingClientRect()
    return rect.width > 0 && rect.height > 0
  })
  for (let left = 0; left < nodes.length; left += 1) for (let right = left + 1; right < nodes.length; right += 1) {
    if (nodes[left].contains(nodes[right]) || nodes[right].contains(nodes[left]) || nodes[left].closest('[data-allow-overlap]') || nodes[right].closest('[data-allow-overlap]')) continue
    const a = nodes[left].getBoundingClientRect()
    const b = nodes[right].getBoundingClientRect()
    if (a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top) result.push(`unmarked overlap: ${nodes[left].textContent?.trim().slice(0, 20)} / ${nodes[right].textContent?.trim().slice(0, 20)}`)
  }

  return result
}
