// Serialized into the browser: keep this function self-contained.
export function collectDiagnostics() {
  const root = document.querySelector('[data-presentation-root]')
  const visible = el => {
    for (let node = el; node; node = node.parentElement) {
      const s = getComputedStyle(node)
      if (s.display === 'none' || s.visibility === 'hidden' || Number(s.opacity) === 0) return false
    }
    return el.getBoundingClientRect().width > 0
  }
  const describe = el => el.getAttribute('aria-label') || el.getAttribute('data-presentation-entity') || el.getAttribute('data-sample-entity') || el.textContent.trim().slice(0, 60) || el.tagName
  const controlSelector = 'button,[data-presentation-attribution]'
  const texts = [...root.querySelectorAll(controlSelector)].filter(el => visible(el) && !el.closest('[data-presentation-allow-overlap="true"]')).map(el => {
    const r = el.getBoundingClientRect()
    return { label: describe(el), rect: { x: r.x, y: r.y, width: r.width, height: r.height } }
  })
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  while (walker.nextNode()) {
    const node = walker.currentNode, el = node.parentElement
    if (!node.textContent.trim() || el.closest(controlSelector) || !visible(el) || el.closest('[data-presentation-allow-overlap="true"]')) continue
    const range = document.createRange(); range.selectNodeContents(node)
    for (const rect of range.getClientRects()) if (rect.width && rect.height) texts.push({ label: describe(el), rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height } })
  }
  const signature = el => {
    const s = getComputedStyle(el)
    return [s.color, s.backgroundColor, s.fontWeight, s.borderColor, s.borderWidth, s.boxShadow, s.opacity, s.textDecorationLine, s.transform].join('|')
  }
  const chrome = ['progress', 'toc'].flatMap(kind => {
    const items = [...root.querySelectorAll(`[data-presentation-${kind}-entry]`)].filter(visible)
    const active = items.find(el => el.dataset.presentationActive === 'true')
    const inactive = items.filter(el => el !== active)
    return active && inactive.length ? [{ kind, active: signature(active), inactive: inactive.map(signature) }] : []
  })
  const link = root.querySelector('[data-presentation-attribution]')
  const s = link && getComputedStyle(link)
  return { texts, chrome, attribution: link && visible(link) ? { fontSize: parseFloat(s.fontSize), color: s.color, fontFamily: s.fontFamily, text: link.textContent, href: link.getAttribute('href') } : null }
}
export function warningsFor(data, step) {
  const warnings = []
  for (let i = 0; i < data.texts.length; i++) for (let j = i + 1; j < data.texts.length; j++) {
    const a = data.texts[i], b = data.texts[j], r = a.rect, s = b.rect
    if (Math.min(r.x + r.width, s.x + s.width) - Math.max(r.x, s.x) > 1 && Math.min(r.y + r.height, s.y + s.height) - Math.max(r.y, s.y) > 1)
      warnings.push(`step ${step}: overlap "${a.label}" / "${b.label}"`)
  }
  for (const c of data.chrome) if (c.inactive.some(s => s === c.active)) warnings.push(`step ${step}: indistinct active ${c.kind} chrome`)
  const a = data.attribution
  if (!a || a.fontSize < 12 || ['rgb(0, 0, 238)', 'rgb(85, 26, 139)'].includes(a.color) || /Times New Roman|^serif$/i.test(a.fontFamily)) warnings.push(`step ${step}: unpolished attribution; style [data-presentation-attribution]`)
  return warnings
}
