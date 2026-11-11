export function rectanglesOverlap(a, b) {
  return Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1
}

export function diagnose({ text = [], chrome = [], attribution = null }) {
  const warnings = []
  for (let i = 0; i < text.length; i++) {
    for (let j = i + 1; j < text.length; j++) {
      const a = text[i]
      const b = text[j]
      if (a.owner === b.owner || (a.allowed && a.allowed === b.allowed)) continue
      if (rectanglesOverlap(a.rect, b.rect)) warnings.push(`overlap: ${a.label} / ${b.label}`)
    }
  }
  for (const kind of ['progress', 'toc']) {
    const controls = chrome.filter((control) => control.kind === kind)
    const active = controls.find((control) => control.active)
    const inactive = controls.find((control) => !control.active)
    if (active && inactive && active.appearance === inactive.appearance) warnings.push(`indistinct active ${kind}: style [data-presentation-${kind === 'toc' ? 'toc-entry' : 'progress'}][data-active]`)
  }
  if (!attribution || attribution.fontSize < 12 || attribution.browserDefault) warnings.push('attribution: style [data-presentation-attribution] for a legible, intentional link')
  return warnings
}

// This function is serializable: Playwright evaluates it inside the page.
export function collectDiagnostics() {
  const text = []
  const chrome = []
  let nextId = 0
  const ids = new WeakMap()
  const id = (node) => {
    if (!ids.has(node)) ids.set(node, ++nextId)
    return ids.get(node)
  }
  const allowed = (node) => {
    const subtree = node.closest('[data-presentation-allow-overlap]')
    return subtree ? id(subtree) : null
  }
  const visible = (node) => {
    const rect = node.getBoundingClientRect()
    if (rect.width <= 0 || rect.height <= 0) return false
    for (let parent = node; parent instanceof Element; parent = parent.parentElement) {
      const style = getComputedStyle(parent)
      if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) return false
    }
    return true
  }
  const rectData = (rect) => ({ left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom })
  const root = document.querySelector('[data-presentation]')
  if (!root) return { text, chrome, attribution: null }
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  let node
  while ((node = walker.nextNode())) {
    const parent = node.parentElement
    if (!node.textContent.trim() || !parent || !visible(parent) || parent.closest('script,style,svg')) continue
    const range = document.createRange()
    range.selectNodeContents(node)
    for (const rect of range.getClientRects()) {
      if (rect.width > 0 && rect.height > 0) text.push({ owner: id(parent), label: `${parent.tagName.toLowerCase()} "${node.textContent.trim().slice(0, 60)}"`, rect: rectData(rect), allowed: allowed(parent) })
    }
  }
  // Include chrome hit areas, while retaining their text's owner to avoid self-collisions.
  for (const control of root.querySelectorAll('[data-presentation-progress],[data-presentation-toc-entry],button,[data-presentation-attribution]')) {
    if (!visible(control)) continue
    const owner = id(control)
    const label = control.getAttribute('aria-label') || control.textContent.trim()
    // Text inside this control is represented by its containing control below.
    for (let i = text.length - 1; i >= 0; i--) {
      if (text[i].owner === owner || [...control.querySelectorAll('*')].some((child) => id(child) === text[i].owner)) text.splice(i, 1)
    }
    text.push({ owner, label: `chrome "${label}"`, rect: rectData(control.getBoundingClientRect()), allowed: allowed(control) })
  }
  for (const [kind, selector] of [['progress', '[data-presentation-progress]'], ['toc', '[data-presentation-toc-entry]']]) {
    for (const control of root.querySelectorAll(selector)) {
      if (!visible(control)) continue
      const style = getComputedStyle(control)
      chrome.push({ kind, active: control.getAttribute('aria-current') === 'step' || control.getAttribute('aria-current') === 'true', appearance: ['color', 'backgroundColor', 'borderColor', 'borderWidth', 'fontWeight', 'textDecorationLine', 'boxShadow', 'opacity', 'outlineColor', 'outlineWidth', 'transform'].map((key) => style[key]).join('|') })
    }
  }
  const link = root.querySelector('[data-presentation-attribution]')
  let attribution = null
  if (link && visible(link)) {
    const style = getComputedStyle(link)
    attribution = { fontSize: Number.parseFloat(style.fontSize), browserDefault: ['rgb(0, 0, 238)', 'rgb(85, 26, 139)'].includes(style.color) && style.textDecorationLine.includes('underline') }
  }
  return { text, chrome, attribution }
}
