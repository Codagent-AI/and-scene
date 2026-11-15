// Runs in the page; keep this function self-contained for Playwright serialization.
export function diagnose() {
  const root = document.querySelector('[data-presentation-root]')
  const step = root?.getAttribute('data-step-index') ?? '?'
  const warnings = []
  const canvas = root?.querySelector('[data-presentation-canvas]')
  if (canvas) { const box = canvas.getBoundingClientRect(); if (box.width <= 0 || box.height <= 0) warnings.push(`step ${step}: zero-size canvas; provide a positive viewport and inspect stage fit`) }
  const visible = element => { const r = element.getBoundingClientRect(); if (r.width <= 0 || r.height <= 0) return false; for (let e = element; e; e = e.parentElement) { const s = getComputedStyle(e); if (s.visibility === 'hidden' || s.display === 'none' || s.opacity === '0') return false } return true }
  const describe = e => e.getAttribute('data-presentation-entity') ?? e.getAttribute('aria-label') ?? (e.textContent.trim().slice(0, 55) || e.id || e.getAttribute('role') || e.tagName.toLowerCase())
  const chrome = '[data-presentation-header],[data-presentation-footer],[data-presentation-navigation],[data-presentation-progress],[data-presentation-toc],[data-presentation-attribution],[data-presentation-mode-toggle]'
  const controls = 'button,a,input,select,textarea,[role="button"],[role="link"],[role="progressbar"],[data-presentation-active]'
  const candidates = [...(root ?? document).querySelectorAll('*')].filter(e => {
    if (e.closest('[data-presentation-allow-overlap]') || !visible(e)) return false
    // Treat a chrome control as one collision target, including its icon/text.
    const owner = e.parentElement?.closest(controls)
    if (owner?.closest(chrome)) return false
    const text = [...e.childNodes].some(n => n.nodeType === Node.TEXT_NODE && n.textContent.trim())
    return text || (e.closest(chrome) && e.matches(`${controls},svg,img,canvas,[role="img"]`))
  })
  const measured = new Map(candidates.map(element => {
    if ((element.closest(chrome) && element.matches(controls)) || element.matches('svg,img,canvas,[role="img"]')) return [element, [element.getBoundingClientRect()]]
    const fragments = [...element.childNodes].filter(n => n.nodeType === Node.TEXT_NODE && n.textContent.trim()).flatMap(text => {
      const range = document.createRange()
      range.selectNodeContents(text)
      return [...range.getClientRects()].filter(box => box.width > 0 && box.height > 0)
    })
    return [element, fragments]
  }))
  const boxes = element => measured.get(element)
  for (let i = 0; i < candidates.length; i++) for (let j = i + 1; j < candidates.length; j++) {
    const a = candidates[i], b = candidates[j]
    if (a.contains(b) || b.contains(a)) continue
    const intersects = boxes(a).some(x => boxes(b).some(y => Math.min(x.right, y.right) - Math.max(x.left, y.left) > 2 && Math.min(x.bottom, y.bottom) - Math.max(x.top, y.top) > 2))
    if (intersects) warnings.push(`step ${step}: overlap: ${describe(a)} / ${describe(b)}`)
  }
  for (const hook of ['progress', 'toc']) {
    const container = root?.querySelector(`[data-presentation-${hook}]`)
    const active = container?.querySelector('[data-presentation-active="true"]')
    const inactive = container?.querySelector('[data-presentation-active="false"]')
    if (active && inactive && visible(active)) {
      const a = getComputedStyle(active), b = getComputedStyle(inactive)
      const props = ['color', 'backgroundColor', 'fontWeight', 'borderColor', 'boxShadow', 'textDecorationLine', 'outlineStyle']
      if (props.every(p => a[p] === b[p])) warnings.push(`step ${step}: indistinct active ${hook}; style [data-presentation-active]`)
    }
  }
  const link = root?.querySelector('[data-presentation-attribution] a')
  if (!link || !visible(link)) warnings.push(`step ${step}: missing attribution; style [data-presentation-attribution]`)
  else {
    const s = getComputedStyle(link)
    if (parseFloat(s.fontSize) < 11 || ['rgb(0, 0, 238)', 'rgb(85, 26, 139)'].includes(s.color)) warnings.push(`step ${step}: unpolished attribution; style [data-presentation-attribution]`)
  }
  return warnings
}
