export function diagnose({ text, chrome, attribution }, step) {
 const warnings = []
 const warn = message => warnings.push(`step ${step}: ${message}`)
 const visible = text.filter(t => t.visible && !t.allowed)
 for (let i = 0; i < visible.length; i++) for (let j = i + 1; j < visible.length; j++) {
  const a = visible[i], b = visible[j]
  if (Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1) warn(`overlap ${a.id} / ${b.id}`)
 }
 for (const kind of ['progress', 'toc-entry']) {
  const controls = chrome.filter(c => c.kind === kind), active = controls.find(c => c.active)
  if (active && controls.some(c => !c.active && c.signature === active.signature)) warn(`indistinct active ${kind} [data-presentation-${kind}]`)
 }
 if (!attribution || attribution.size < 11 || (attribution.family.includes('Times New Roman') && attribution.color === 'rgb(0, 0, 238)' && attribution.decoration.includes('underline'))) warn('unpolished attribution: style [data-presentation-attribution]')
 return warnings
}
// Runs in the page: text-node ranges avoid counting an ancestor and its child twice.
export function collectDiagnostics() {
 const root = document.querySelector('[data-presentation-root]')
 const text = [], walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
 function identity(el) { return el.getAttribute('data-entity') || el.id || [...el.attributes].find(a => a.name.startsWith('data-presentation-'))?.name || el.tagName.toLowerCase() }
 let node
 while ((node = walker.nextNode())) {
  if (!node.textContent.trim()) continue
  const el = node.parentElement, style = getComputedStyle(el), range = document.createRange()
  range.selectNodeContents(node)
  const r = range.getBoundingClientRect()
  const visible = el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }) && Number(style.opacity) !== 0 && r.width > 0 && r.height > 0
  text.push({ id: `${identity(el)}:${node.textContent.trim().slice(0, 28)}`, visible, allowed: !!el.closest('[data-presentation-allow-overlap]'), left: r.left, right: r.right, top: r.top, bottom: r.bottom })
 }
 const chrome = [...root.querySelectorAll('[data-presentation-progress],[data-presentation-toc-entry]')].map(el => {
  const s = getComputedStyle(el)
  return { kind: el.hasAttribute('data-presentation-progress') ? 'progress' : 'toc-entry', active: el.getAttribute('aria-current') === 'step', signature: [s.color, s.backgroundColor, s.borderColor, s.fontWeight, s.opacity, s.boxShadow, s.textDecoration, s.transform].join('|') }
 })
 const a = root.querySelector('[data-presentation-attribution]'), s = a && getComputedStyle(a)
 return { text, chrome, attribution: s && a.checkVisibility({ checkOpacity: true }) ? { size: parseFloat(s.fontSize), family: s.fontFamily, color: s.color, decoration: s.textDecorationLine } : null }
}
