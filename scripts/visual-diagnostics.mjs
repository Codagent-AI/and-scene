// Advisory visual-composition diagnostics, evaluated inside the browser page.
// Kept dependency- and closure-free so it can be passed straight to page.evaluate().
export function collectVisualDiagnostics() {
  const TEXT_AND_CHROME = '[data-presentation-label],[data-presentation-box],[data-presentation-caption],[data-presentation-title],[data-presentation-present-title]'
  const SCENE_ENTITIES = '[data-presentation-box],[data-presentation-label],[data-presentation-arrow],[data-presentation-frame],[data-presentation-emphasis],[data-presentation-symbol-chip]'
  const DISTINCTION_PROPERTIES = ['backgroundColor', 'color', 'borderColor', 'opacity', 'fontWeight']
  const result = []

  const labelFor = (node) => node.getAttribute('data-entity-id') || node.textContent?.trim().slice(0, 24) || node.tagName
  const visible = (selector) => [...document.querySelectorAll(selector)]
    .map((node) => ({ node, rect: node.getBoundingClientRect() }))
    .filter(({ rect }) => rect.width > 0 && rect.height > 0)

  const intersects = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top
  // A Frame draws around the diagram by design, so content it fully surrounds is
  // composition rather than collision. Any other full cover still obscures content.
  const frames = (outer, inner) => outer.node.matches('[data-presentation-frame]')
    && outer.rect.left <= inner.rect.left && outer.rect.top <= inner.rect.top
    && outer.rect.right >= inner.rect.right && outer.rect.bottom >= inner.rect.bottom

  const checkActiveState = (label, activeSelector, inactiveSelector) => {
    const active = document.querySelector(activeSelector)
    const inactive = document.querySelector(inactiveSelector)
    if (!active || !inactive) return
    const activeStyle = getComputedStyle(active)
    const inactiveStyle = getComputedStyle(inactive)
    if (DISTINCTION_PROPERTIES.every((property) => activeStyle[property] === inactiveStyle[property])) result.push(`active ${label} may be visually indistinct`)
  }

  checkActiveState('progress', '[data-presentation-progress-item="active"]', '[data-presentation-progress] button:not([data-presentation-progress-item="active"])')
  checkActiveState('table-of-contents entry', '[data-presentation-toc-item="active"]', '[data-presentation-toc] button:not([data-presentation-toc-item="active"])')

  const attribution = document.querySelector('[data-presentation-attribution]')
  if (!attribution || parseFloat(getComputedStyle(attribution).fontSize) < 11) result.push('attribution is missing or undersized; style [data-presentation-attribution]')

  // The scene is drawn on a fixed canvas, so anything escaping it is cropped on screen.
  const canvas = document.querySelector('[data-presentation-canvas]')?.getBoundingClientRect()
  if (canvas) {
    for (const { node, rect } of visible(SCENE_ENTITIES)) {
      if (rect.left < canvas.left - 1 || rect.top < canvas.top - 1 || rect.right > canvas.right + 1 || rect.bottom > canvas.bottom + 1) result.push(`content outside fixed canvas: ${labelFor(node)}`)
      if (node.scrollWidth > node.clientWidth + 1 || node.scrollHeight > node.clientHeight + 1) result.push(`clipped text: ${labelFor(node)}`)
    }
  }

  const nodes = visible(`${TEXT_AND_CHROME},${SCENE_ENTITIES}`).map((entry) => ({ ...entry, allowed: !!entry.node.closest('[data-allow-overlap]') }))
  for (let left = 0; left < nodes.length; left += 1) {
    for (let right = left + 1; right < nodes.length; right += 1) {
      const a = nodes[left]
      const b = nodes[right]
      if (a.allowed || b.allowed || a.node.contains(b.node) || b.node.contains(a.node)) continue
      if (!intersects(a.rect, b.rect) || frames(a, b) || frames(b, a)) continue
      result.push(`unmarked overlap: ${labelFor(a.node)} / ${labelFor(b.node)}`)
    }
  }

  return result
}
