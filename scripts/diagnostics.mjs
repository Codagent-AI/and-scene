// Runs in the page; keep this function self-contained for Playwright serialization.
export function diagnose() {
  const root = document.querySelector('[data-presentation-root]')
  const step = root?.getAttribute('data-step-index') ?? '?'
  const warnings = []
  const visible = element => { const r = element.getBoundingClientRect(); if (r.width <= 0 || r.height <= 0) return false; for (let e = element; e; e = e.parentElement) { const s = getComputedStyle(e); if (s.visibility === 'hidden' || s.display === 'none' || s.opacity === '0') return false } return true }
  const describe = e => e.getAttribute('data-presentation-entity') ?? e.getAttribute('aria-label') ?? e.textContent.trim().slice(0, 55)
  const candidates = [...(root ?? document).querySelectorAll('*')].filter(e => !e.closest('[data-presentation-allow-overlap]') && visible(e) && [...e.childNodes].some(n => n.nodeType === Node.TEXT_NODE && n.textContent.trim()))
  for (let i = 0; i < candidates.length; i++) for (let j = i + 1; j < candidates.length; j++) {
    const a = candidates[i], b = candidates[j]
    if (a.contains(b) || b.contains(a)) continue
    const x = a.getBoundingClientRect(), y = b.getBoundingClientRect()
    if (Math.min(x.right, y.right) - Math.max(x.left, y.left) > 2 && Math.min(x.bottom, y.bottom) - Math.max(x.top, y.top) > 2) warnings.push(`step ${step}: overlap: ${describe(a)} / ${describe(b)}`)
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
