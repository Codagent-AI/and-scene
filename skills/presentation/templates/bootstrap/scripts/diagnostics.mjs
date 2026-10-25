export function diagnose({ text, controls = [], chrome, attribution }, step) {
 const warnings = []
 const warn = message => warnings.push(`step ${step}: ${message}`)
 const visible = [...text, ...controls].filter(t => t.visible && !t.allowed)
 for (let i = 0; i < visible.length; i++) for (let j = i + 1; j < visible.length; j++) {
  const a = visible[i], b = visible[j]
  if (a.owner !== undefined && (a.owner === b.owner || a.ancestors?.includes(b.owner) || b.ancestors?.includes(a.owner))) continue
  if (Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1) warn(`overlap ${a.id} / ${b.id}`)
 }
 for (const kind of ['progress', 'toc-entry']) {
  const controls = chrome.filter(c => c.kind === kind), active = controls.find(c => c.active)
  if (active && controls.some(c => !c.active && c.signature === active.signature)) warn(`indistinct active ${kind} [data-presentation-${kind}]`)
 }
 if (!attribution || attribution.size < 12 || (attribution.family.includes('Times New Roman') && attribution.color === 'rgb(0, 0, 238)')) warn('unpolished attribution: style [data-presentation-attribution]')
 return warnings
}
// Runs in the page: text-node ranges avoid counting an ancestor and its child twice.
export function collectDiagnostics() {
 const root = document.querySelector('[data-presentation-root]')
 const owners = new Map()
 const owner = el => { if (!owners.has(el)) owners.set(el, owners.size); return owners.get(el) }
 function participant(el, r, id) {
  const ancestors = []
  for (let parent = el.parentElement; parent; parent = parent.parentElement) ancestors.push(owner(parent))
  return { id, owner: owner(el), ancestors, visible: el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }) && Number(getComputedStyle(el).opacity) !== 0 && r.width > 0 && r.height > 0, allowed: !!el.closest('[data-presentation-allow-overlap]'), left: r.left, right: r.right, top: r.top, bottom: r.bottom }
 }
 const text = [], walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
 function identity(el) { return el.getAttribute('data-entity') || el.id || [...el.attributes].find(a => a.name.startsWith('data-presentation-'))?.name || el.tagName.toLowerCase() }
 let node
 while ((node = walker.nextNode())) {
  if (!node.textContent.trim()) continue
  const el = node.parentElement, range = document.createRange()
  range.selectNodeContents(node)
  const r = range.getBoundingClientRect()
  text.push(participant(el, r, `${identity(el)}:${node.textContent.trim().slice(0, 28)}`))
 }
 const controlHooks = ['progress', 'toc-entry', 'prev', 'next', 'mode-toggle', 'attribution']
 const controls = [...root.querySelectorAll(controlHooks.map(h => `[data-presentation-${h}]`).join(','))].map(el => participant(el, el.getBoundingClientRect(), identity(el)))
 const chrome = [...root.querySelectorAll('[data-presentation-progress],[data-presentation-toc-entry]')].map(el => {
  const s = getComputedStyle(el), r = el.getBoundingClientRect()
  return { kind: el.hasAttribute('data-presentation-progress') ? 'progress' : 'toc-entry', active: el.getAttribute('aria-current') === 'step', signature: [s.color, s.backgroundColor, s.border, r.width, r.height, s.fontWeight, s.opacity, s.boxShadow, s.textDecoration, s.transform].join('|') }
 })
 const a = root.querySelector('[data-presentation-attribution]'), s = a && getComputedStyle(a)
 return { text, controls, chrome, attribution: s && a.checkVisibility({ checkOpacity: true }) ? { size: parseFloat(s.fontSize), family: s.fontFamily, color: s.color, decoration: s.textDecorationLine } : null }
}
