// In-page advisory diagnostics for the inspection helper. `collectDiagnostics`
// runs inside the browser (Playwright serializes it), so it must stay self-contained.

export function collectDiagnostics() {
  const CHROME =
    '[data-presentation-header],[data-presentation-footer],[data-presentation-toc],[data-presentation-attribution]'
  const visible = (el) =>
    el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }) &&
    Number(getComputedStyle(el).opacity) > 0.05
  const label = (el) => {
    const hook = [...el.attributes].find((a) => a.name.startsWith('data-presentation-'))
    const text = (el.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 40)
    return `<${el.tagName.toLowerCase()}${hook ? ` ${hook.name}` : ''}> "${text}"`
  }

  // Visible text-bearing elements, measured by the text's own box.
  const texts = []
  for (const el of document.body.querySelectorAll('*')) {
    if (!visible(el)) continue
    const own = [...el.childNodes].filter((n) => n.nodeType === 3 && n.textContent.trim())
    if (!own.length) continue
    const range = document.createRange()
    range.setStartBefore(own[0])
    range.setEndAfter(own[own.length - 1])
    const r = range.getBoundingClientRect()
    if (r.width < 1 || r.height < 1) continue
    texts.push({ el, r })
  }

  const allowed = (el) => el.closest('[data-presentation-allow-overlap]') !== null
  const overlaps = []
  for (let i = 0; i < texts.length; i++) {
    for (let j = i + 1; j < texts.length; j++) {
      const a = texts[i]
      const b = texts[j]
      if (a.el.contains(b.el) || b.el.contains(a.el)) continue
      if (allowed(a.el) || allowed(b.el)) continue
      const w = Math.min(a.r.right, b.r.right) - Math.max(a.r.left, b.r.left)
      const h = Math.min(a.r.bottom, b.r.bottom) - Math.max(a.r.top, b.r.top)
      if (w > 2 && h > 2) overlaps.push(`${label(a.el)} overlaps ${label(b.el)}`)
    }
  }
  // Chrome blocks themselves colliding with visible scene text.
  const chromeBoxes = [...document.querySelectorAll(CHROME)].filter(visible)
  const sceneTexts = texts.filter((t) => t.el.closest('[data-presentation-scene]'))
  for (const chrome of chromeBoxes) {
    const cr = chrome.getBoundingClientRect()
    for (const t of sceneTexts) {
      if (allowed(t.el)) continue
      const w = Math.min(cr.right, t.r.right) - Math.max(cr.left, t.r.left)
      const h = Math.min(cr.bottom, t.r.bottom) - Math.max(cr.top, t.r.top)
      const own = [...chrome.querySelectorAll('*')].some((c) => {
        const r = c.getBoundingClientRect()
        const ow = Math.min(r.right, t.r.right) - Math.max(r.left, t.r.left)
        const oh = Math.min(r.bottom, t.r.bottom) - Math.max(r.top, t.r.top)
        return c.children.length === 0 && ow > 2 && oh > 2
      })
      if (w > 2 && h > 2 && own) overlaps.push(`${label(t.el)} collides with chrome ${label(chrome)}`)
    }
  }

  // Chrome controls and text blocks colliding with each other (boxes, not just their text).
  const chromeParts = [
    ...document.querySelectorAll(
      '[data-presentation-dot],[data-presentation-toc-item],[data-presentation-prev],[data-presentation-next],' +
        '[data-presentation-attribution],[data-presentation-marker],[data-presentation-title],' +
        '[data-presentation-step-title],[data-presentation-caption]',
    ),
  ].filter(visible)
  for (let i = 0; i < chromeParts.length; i++) {
    for (let j = i + 1; j < chromeParts.length; j++) {
      const a = chromeParts[i]
      const b = chromeParts[j]
      if (a.contains(b) || b.contains(a) || allowed(a) || allowed(b)) continue
      const ar = a.getBoundingClientRect()
      const br = b.getBoundingClientRect()
      const w = Math.min(ar.right, br.right) - Math.max(ar.left, br.left)
      const h = Math.min(ar.bottom, br.bottom) - Math.max(ar.top, br.top)
      if (w > 2 && h > 2) overlaps.push(`chrome ${label(a)} overlaps chrome ${label(b)}`)
    }
  }

  // Active chrome must differ from inactive siblings in at least one visual property.
  const PROPS = [
    'backgroundColor', 'color', 'borderTopColor', 'borderLeftColor', 'borderTopWidth',
    'width', 'height', 'opacity', 'boxShadow', 'fontWeight', 'outlineStyle', 'transform',
    'textDecorationLine',
  ]
  const SIZE = ['width', 'height']
  // A labelled entry's box size follows its text, so only unlabelled markers (dots) count it.
  const signature = (el) => {
    const cs = getComputedStyle(el)
    const labelled = (el.textContent ?? '').trim() !== ''
    return PROPS.filter((p) => !(labelled && SIZE.includes(p))).map((p) => cs[p]).join('|')
  }
  const indistinct = []
  for (const [name, sel] of [
    ['progress indicator', '[data-presentation-dot]'],
    ['table-of-contents entry', '[data-presentation-toc-item]'],
  ]) {
    const items = [...document.querySelectorAll(sel)]
    const active = items.find((el) => el.hasAttribute('data-presentation-active'))
    const inactive = items.find((el) => !el.hasAttribute('data-presentation-active'))
    if (active && inactive && signature(active) === signature(inactive)) {
      indistinct.push(`active ${name} looks the same as inactive ones; style [data-presentation-active]`)
    }
  }

  const attribution = []
  const link = document.querySelector('[data-presentation-attribution]')
  if (link) {
    const cs = getComputedStyle(link)
    const size = parseFloat(cs.fontSize)
    if (size < 11) attribution.push(`attribution text is ${size}px; style [data-presentation-attribution]`)
    if (cs.color === 'rgb(0, 0, 238)' || cs.color === 'rgb(85, 26, 139)') {
      attribution.push('attribution uses the browser-default link color; style [data-presentation-attribution]')
    }
  }
  return { overlaps, indistinct, attribution }
}
