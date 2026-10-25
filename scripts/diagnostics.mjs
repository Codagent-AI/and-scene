// Executed in the page: keep this function self-contained for Playwright serialization.
export function inspectDocument() {
  const root = document.querySelector('[data-presentation]')
  const index = root?.getAttribute('data-step-index') ?? '?'
  const warnings = []
  const warn = message => warnings.push(`step ${index}: ${message}`)
  const visible = el => {
    const box = el.getBoundingClientRect(), css = getComputedStyle(el)
    if (box.width <= 0 || box.height <= 0 || css.visibility === 'hidden' || css.display === 'none') return false
    for (let node = el; node; node = node.parentElement) if (parseFloat(getComputedStyle(node).opacity) === 0) return false
    return true
  }
  const describe = el => `${el.tagName.toLowerCase()}[${el.getAttribute('data-story-name') ?? el.getAttribute('data-presentation-entity') ?? el.textContent?.trim().slice(0, 55)}]`
  const nodes = [...root.querySelectorAll('*')].filter(el => visible(el) && !el.closest('[data-presentation-allow-overlap]') && [...el.childNodes].some(n => n.nodeType === Node.TEXT_NODE && n.textContent.trim()))
  // Text ranges avoid treating decorative frames and text containers as occupied text.
  const rects = el => [...el.childNodes].filter(n => n.nodeType === Node.TEXT_NODE && n.textContent.trim()).flatMap(n => {
    const range = document.createRange(); range.selectNodeContents(n)
    return [...range.getClientRects()]
  })
  for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) {
    const a = nodes[i], b = nodes[j]
    if (a.contains(b) || b.contains(a)) continue
    if (rects(a).some(x => rects(b).some(y => Math.min(x.right, y.right) - Math.max(x.left, y.left) > 1 && Math.min(x.bottom, y.bottom) - Math.max(x.top, y.top) > 1))) warn(`overlap ${describe(a)} / ${describe(b)}`)
  }
  const signature = el => {
    const css = getComputedStyle(el)
    return ['color', 'backgroundColor', 'borderColor', 'fontWeight', 'boxShadow', 'textDecorationLine', 'outlineStyle', 'opacity', 'transform'].map(k => css[k]).join('|')
  }
  for (const hook of ['data-presentation-progress-step', 'data-presentation-toc-entry']) {
    const controls = [...root.querySelectorAll(`[${hook}]`)].filter(visible)
    const active = controls.find(el => el.getAttribute('data-presentation-active') === 'true')
    const inactive = controls.find(el => el.getAttribute('data-presentation-active') !== 'true')
    if (active && inactive && signature(active) === signature(inactive)) warn(`indistinct active chrome ${hook}`)
  }
  const attribution = root.querySelector('[data-presentation-attribution]')
  if (!attribution || !visible(attribution)) warn('missing attribution; style [data-presentation-attribution]')
  else {
    const css = getComputedStyle(attribution)
    const defaultLink = ['rgb(0, 0, 238)', 'rgb(85, 26, 139)'].includes(css.color) && css.textDecorationLine.includes('underline')
    if (parseFloat(css.fontSize) < 11 || defaultLink) warn('unpolished attribution; style [data-presentation-attribution] (undersized or browser-default)')
  }
  return warnings
}
