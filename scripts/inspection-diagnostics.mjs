export function collectDiagnostics(doc = document) {
  const warnings = []
  const visible = (element) => {
    const rect = element.getBoundingClientRect()
    const style = doc.defaultView.getComputedStyle(element)
    return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none'
  }
  const styleSignature = (element) => {
    const style = doc.defaultView.getComputedStyle(element)
    return ['color', 'backgroundColor', 'borderColor', 'fontWeight', 'opacity', 'outlineColor'].map((key) => style[key]).join('|')
  }
  const overlaps = (a, b) => {
    const x = a.getBoundingClientRect(), y = b.getBoundingClientRect()
    return x.left < y.right && x.right > y.left && x.top < y.bottom && x.bottom > y.top
  }
  const textNodes = [...doc.querySelectorAll('[data-inspect-text], [data-presentation-stage-region] *, [data-presentation-narration] *, [data-presentation-title], [data-presentation-marker], [data-presentation-attribution]')]
    .filter((element) => visible(element) && [...element.childNodes].some((node) => node.nodeType === 3 && node.textContent.trim()))
  const chrome = [...doc.querySelectorAll('[data-inspect-chrome], [data-presentation-controls], [data-presentation-toc], [data-presentation-header], [data-presentation-attribution]')].filter(visible)
  const candidates = [...new Set([...textNodes, ...chrome])]
  const ordinal = new Map(candidates.map((element, index) => [element, index]))
  const snippet = (value) => value.toString().trim().replace(/\s+/g, ' ').slice(0, 42)
  const checked = new Set()
  for (const text of textNodes) {
    for (const other of candidates) {
      if (text === other || text.contains(other) || other.contains(text)) continue
      const pair = [ordinal.get(text), ordinal.get(other)].sort((a, b) => a - b).join(':')
      if (checked.has(pair)) continue
      checked.add(pair)
      if (text.closest('[data-presentation-allow-overlap]') || other.closest('[data-presentation-allow-overlap]')) continue
      if (overlaps(text, other)) {
        const label = other.textContent || other.getAttribute('aria-label') || other.className?.baseVal || other.className || 'chrome'
        warnings.push(`Unmarked visible text/chrome overlap: “${snippet(text.textContent)}” overlaps “${snippet(label)}”`)
      }
    }
  }
  for (const selector of ['[data-presentation-progress]', '[data-presentation-toc]']) {
    const nav = doc.querySelector(selector)
    if (!nav || !visible(nav)) continue
    const active = nav.querySelector('[aria-current="step"], [data-active="true"]')
    const peers = [...nav.children].filter((item) => item !== active && visible(item))
    if (!active || !peers.length) continue
    const activeSignature = styleSignature(active)
    const distinct = peers.some((peer) => styleSignature(peer) !== activeSignature)
    if (!distinct) warnings.push(`Active ${selector.includes('progress') ? 'progress indicator' : 'table-of-contents entry'} may be visually indistinct`)
  }
  const attribution = doc.querySelector('[data-presentation-attribution]')
  if (!attribution || !visible(attribution)) warnings.push('Presentation attribution is missing or hidden')
  else {
    const style = doc.defaultView.getComputedStyle(attribution)
    const browserDefault = /^(?:\"?Times New Roman\"?|serif)$/i.test(style.fontFamily.trim()) || style.textDecorationLine === 'underline' && style.color === 'rgb(0, 0, 238)'
    if (Number.parseFloat(style.fontSize) < 11 || browserDefault) warnings.push('Attribution may be undersized or browser-default styled; use the data-presentation-attribution hook')
  }
  return warnings
}
