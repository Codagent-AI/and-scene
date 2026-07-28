// Advisory visual-quality checks for `scripts/inspect-presentation.mjs`.
//
// Every export here is serialized into the browser by `page.evaluate`, so each
// function must be self-contained: no imports, no module-scope references.
// They live in their own module purely so they can be unit tested in jsdom.

/**
 * Runs in-page: finds scene content inside the stage that overlaps presentation
 * chrome without an explicit allow-overlap marker.
 *
 * Two kinds of scene content are considered:
 *   - leaf text elements, whose glyphs collide visibly with chrome text; and
 *   - kit nodes that paint their own boundary (frame/box/symbol chip), which
 *     have children and therefore are not leaves, but whose borders and
 *     backgrounds still visibly cross chrome.
 * Structural wrappers (scene layers, appear/motion wrappers) are skipped: they
 * span the whole canvas by construction, so treating them as overlap sources
 * would warn on every step regardless of composition.
 */
export function findUnmarkedOverlaps() {
  const stage = document.querySelector('[data-presentation-stage]')
  if (!stage) return []

  const chromeNames = ['header', 'footer', 'caption', 'progress', 'toc', 'nav-controls', 'attribution']
  // Kit nodes that paint a visible boundary of their own.
  const boundedSceneNames = ['frame', 'box', 'symbol-chip']

  const hook = (name) => `[data-presentation-${name}]`
  const matchName = (el, names) => names.find((name) => el.matches(hook(name)))
  const intersects = (a, b) =>
    a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top

  const isVisible = (el) => {
    const style = window.getComputedStyle(el)
    return style.visibility !== 'hidden' && style.display !== 'none' && Number(style.opacity) > 0
  }

  const describeScene = (el) => {
    const name = matchName(el, boundedSceneNames)
    return name ? `scene ${name}` : `scene text "${el.textContent?.trim().slice(0, 40)}"`
  }

  const chromeBoxes = chromeNames
    .flatMap((name) => Array.from(document.querySelectorAll(hook(name))))
    .map((el) => ({ el, name: matchName(el, chromeNames), rect: el.getBoundingClientRect() }))
    .filter(({ rect }) => rect.width > 0 && rect.height > 0)

  const candidates = Array.from(stage.querySelectorAll('*')).filter((el) => {
    if (!isVisible(el)) return false
    if (matchName(el, boundedSceneNames)) return true
    // Leaf text nodes only: a text-bearing container would double-report its child.
    return Boolean(el.textContent?.trim()) && el.children.length === 0
  })

  const warnings = []
  for (const sceneEl of candidates) {
    if (sceneEl.closest('[data-presentation-allow-overlap]')) continue
    const sceneRect = sceneEl.getBoundingClientRect()
    if (sceneRect.width === 0 || sceneRect.height === 0) continue
    for (const chrome of chromeBoxes) {
      if (chrome.el.contains(sceneEl) || sceneEl.contains(chrome.el)) continue
      if (intersects(sceneRect, chrome.rect)) {
        warnings.push(`${describeScene(sceneEl)} overlaps ${chrome.name} chrome`)
      }
    }
  }
  return warnings
}

/** Runs in-page: checks the active progress dot / toc entry reads as visually distinct. */
export function findIndistinctActiveState() {
  const warnings = []
  const groups = [
    { selector: '[data-presentation-progress-dot]', label: 'progress dot' },
    { selector: '[data-presentation-toc-entry]', label: 'table-of-contents entry' },
  ]
  for (const group of groups) {
    const els = Array.from(document.querySelectorAll(group.selector))
    const active = els.find((el) => el.getAttribute('data-active') === 'true')
    const inactive = els.find((el) => el.getAttribute('data-active') !== 'true')
    if (!active || !inactive) continue
    const activeStyle = window.getComputedStyle(active)
    const inactiveStyle = window.getComputedStyle(inactive)
    const same =
      activeStyle.backgroundColor === inactiveStyle.backgroundColor &&
      activeStyle.color === inactiveStyle.color &&
      activeStyle.borderColor === inactiveStyle.borderColor &&
      activeStyle.opacity === inactiveStyle.opacity &&
      activeStyle.fontWeight === inactiveStyle.fontWeight
    if (same) {
      warnings.push(`active ${group.label} is not visually distinct from an inactive sibling`)
    }
  }
  return warnings
}

/** Runs in-page: checks the attribution link is present, sized, and non-default. */
export function checkAttribution() {
  const attribution = document.querySelector('[data-presentation-attribution]')
  if (!attribution) return ['attribution link is missing']
  const rect = attribution.getBoundingClientRect()
  const style = window.getComputedStyle(attribution)
  const warnings = []
  if (rect.width < 40 || rect.height < 10) {
    warnings.push(`attribution link is undersized (${Math.round(rect.width)}x${Math.round(rect.height)}px)`)
  }
  // A completely unstyled anchor keeps the UA default blue/underline.
  const isDefaultBlue = /rgb\(0,\s*0,\s*238\)/.test(style.color)
  if (isDefaultBlue && style.textDecorationLine === 'underline') {
    warnings.push('attribution link appears to use unstyled browser defaults')
  }
  return warnings
}
