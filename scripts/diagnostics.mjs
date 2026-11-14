// Runs in the page; keep this function self-contained for Playwright serialization.
export function visualDiagnostics() {
  const warnings = []
  const root = document.querySelector('[data-presentation-root]')
  if (!root) return ['missing presentation root']
  const step = root.getAttribute('data-step-index')
  const visible = node => {
    if (!node.getBoundingClientRect().width || !node.getBoundingClientRect().height) return false
    for (let p = node; p; p = p.parentElement) {
      const s = getComputedStyle(p)
      if (s.display === 'none' || s.visibility === 'hidden' || Number(s.opacity) === 0) return false
    }
    return true
  }
  const describe = node => node.getAttribute('data-presentation-entity') || node.getAttribute('aria-label') || node.textContent.trim().slice(0, 70) || node.tagName
  const candidates = []
  const exempt = node => !!node.closest('[data-presentation-allow-overlap="true"]')
  for (const node of root.querySelectorAll('button,a')) {
    if (visible(node) && !exempt(node)) candidates.push({ node, rect: node.getBoundingClientRect(), label: describe(node) })
  }
  // Text inside the fitted canvas shrinks with its ancestors' scale, so judge the size a viewer actually sees.
  const MIN_TEXT_PX = 8
  const renderedSize = node => {
    let size = parseFloat(getComputedStyle(node).fontSize)
    for (let p = node; p && size; p = p.parentElement) {
      const m = /^matrix(?:3d)?\(([^)]+)\)/.exec(getComputedStyle(p).transform || '')
      if (m) { const [a, b] = m[1].split(',').map(Number); size *= Math.hypot(a, b) || 1 }
    }
    return size
  }
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  while (walker.nextNode()) {
    const text = walker.currentNode, node = text.parentElement
    if (!text.textContent.trim() || node.closest('button,a,script,style,defs,title,desc') || !visible(node)) continue
    const rendered = renderedSize(node)
    if (rendered < MIN_TEXT_PX) warnings.push(`step ${step}: small text: ${text.textContent.trim().slice(0, 70)} renders at ${rendered.toFixed(1)}px; raise its size in the 880x380 canvas (below ${MIN_TEXT_PX}px)`)
    if (exempt(node)) continue
    // SVG text/tspan/textPath renders glyphs; SVG metadata and geometry do not.
    if (node.namespaceURI === 'http://www.w3.org/2000/svg' && !node.closest('text')) continue
    const range = document.createRange(); range.selectNodeContents(text)
    for (const rect of range.getClientRects()) if (rect.width && rect.height) candidates.push({ node, rect, label: text.textContent.trim().slice(0, 70) })
  }
  for (let i = 0; i < candidates.length; i++) for (let j = i + 1; j < candidates.length; j++) {
    const a = candidates[i], b = candidates[j]
    if (a.node === b.node) continue
    if (Math.min(a.rect.right, b.rect.right) - Math.max(a.rect.left, b.rect.left) > 1 && Math.min(a.rect.bottom, b.rect.bottom) - Math.max(a.rect.top, b.rect.top) > 1) warnings.push(`step ${step}: overlap: ${a.label} / ${b.label}`)
  }
  const signature = node => {
    const s = getComputedStyle(node)
    return [s.color, s.backgroundColor, s.borderColor, s.fontWeight, s.boxShadow, s.opacity, s.transform, s.textDecorationLine].join('|')
  }
  for (const hook of ['progress-step', 'toc-entry']) {
    const nodes = [...root.querySelectorAll(`[data-presentation-${hook}]`)].filter(visible)
    const active = nodes.find(n => n.getAttribute('data-presentation-active') === 'true')
    const inactive = nodes.find(n => n.getAttribute('data-presentation-active') !== 'true')
    if (active && inactive && signature(active) === signature(inactive)) warnings.push(`step ${step}: indistinct active ${hook}`)
  }
  const link = root.querySelector('[data-presentation-attribution]')
  if (!link || !visible(link)) warnings.push(`step ${step}: missing attribution; style [data-presentation-attribution]`)
  else {
    const s = getComputedStyle(link)
    if (parseFloat(s.fontSize) < 12 || ['rgb(0, 0, 238)', 'rgb(85, 26, 139)'].includes(s.color) || /Times New Roman/.test(s.fontFamily)) warnings.push(`step ${step}: unpolished attribution; style [data-presentation-attribution]`)
  }
  return [...new Set(warnings)]
}
