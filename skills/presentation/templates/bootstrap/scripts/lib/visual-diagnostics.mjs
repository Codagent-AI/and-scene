// Passed to page.evaluate; browser-side helpers must stay inside this function.
export function collectVisualDiagnostics() {
  function isVisible(element) {
    const style = getComputedStyle(element)
    const box = element.getBoundingClientRect()
    return style.visibility !== 'hidden' && style.display !== 'none' &&
      Number(style.opacity) > 0 && box.width > 0 && box.height > 0
  }

  function textFragments(element) {
    const fragments = []
    for (const node of element.childNodes) {
      if (node.nodeType !== Node.TEXT_NODE || !node.textContent?.trim()) continue
      const range = document.createRange()
      range.selectNodeContents(node)
      for (const box of range.getClientRects()) {
        fragments.push({ node, box, text: node.textContent.trim() })
      }
    }
    return fragments
  }

  function overlaps(left, right) {
    return left.left < right.right && left.right > right.left &&
      left.top < right.bottom && left.bottom > right.top
  }

  function findTextCollisions() {
    const selector = [
      '[data-presentation-canvas-host] *',
      '[data-presentation-header] *',
      '[data-presentation-footer] *',
      '[data-presentation-toc] *',
      '[data-presentation-mode-toggle]',
    ].join(', ')
    const fragments = [...document.querySelectorAll(selector)]
      .filter(isVisible)
      .filter((element) => !element.closest('[data-presentation-allow-overlap="true"]'))
      .flatMap(textFragments)
    const collisions = []
    for (let leftIndex = 0; leftIndex < fragments.length; leftIndex += 1) {
      const left = fragments[leftIndex]
      for (const right of fragments.slice(leftIndex + 1)) {
        // Wrapped fragments of one text node are not separate colliding labels.
        if (left.node === right.node || !overlaps(left.box, right.box)) continue
        collisions.push(`${left.text.slice(0, 30)} / ${right.text.slice(0, 30)}`)
      }
    }
    return collisions
  }

  function isIndistinct(active) {
    const siblings = [...active.parentElement?.querySelectorAll('button') ?? []]
    const inactive = siblings.find((candidate) => candidate !== active)
    if (!inactive) return false
    const activeStyle = getComputedStyle(active)
    const inactiveStyle = getComputedStyle(inactive)
    const properties = ['color', 'backgroundColor', 'borderColor', 'fontWeight', 'opacity']
    return properties.every((property) => activeStyle[property] === inactiveStyle[property])
  }

  function inspectAttribution() {
    const attribution = document.querySelector('[data-presentation-attribution]')
    if (!attribution) return null
    const style = getComputedStyle(attribution)
    return {
      linked: attribution instanceof HTMLAnchorElement && Boolean(attribution.getAttribute('href')),
      fontSize: Number.parseFloat(style.fontSize),
      browserDefault: style.color === 'rgb(0, 0, 238)',
    }
  }

  const activeControls = [...document.querySelectorAll('[data-presentation-active="true"]')]
  const hasNavigation = Boolean(document.querySelector('[data-presentation-progress], [data-presentation-toc]'))
  return {
    collisions: findTextCollisions(),
    noActiveState: hasNavigation && activeControls.length === 0,
    indistinct: activeControls.some(isIndistinct),
    attribution: inspectAttribution(),
  }
}
