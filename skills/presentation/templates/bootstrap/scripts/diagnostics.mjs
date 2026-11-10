// Executed in the page by Playwright; kept independent for focused diagnostic tests.
export function diagnose() {
  const warnings = []
  const label = element => element.getAttribute('aria-label') || element.getAttribute('data-presentation-entity') || element.textContent.trim().slice(0, 70) || element.tagName
  const visible = element => {
    const style = getComputedStyle(element), rect = element.getBoundingClientRect()
    return style.visibility !== 'hidden' && style.display !== 'none' && Number(style.opacity) > 0 && rect.width > 0 && rect.height > 0
  }
  const marked = element => element.closest('[data-presentation-allow-overlap]')
  const elements = [...document.querySelectorAll('[data-presentation] *')].filter(element => {
    if (!visible(element) || marked(element)) return false
    return [...element.childNodes].some(node => node.nodeType === 3 && node.textContent.trim())
  })
  // Text ranges avoid treating a decorative container or transparent frame as text.
  const bounds = element => {
    const ranges = [...element.childNodes].filter(node => node.nodeType === 3 && node.textContent.trim()).flatMap(node => {
      const range = document.createRange(); range.selectNodeContents(node)
      return [...range.getClientRects()]
    })
    return ranges
  }
  for (let i = 0; i < elements.length; i++) for (let j = i + 1; j < elements.length; j++) {
    const a = elements[i], b = elements[j]
    if (a.contains(b) || b.contains(a)) continue
    if (bounds(a).some(x => bounds(b).some(y => Math.min(x.right, y.right) - Math.max(x.left, y.left) > 1 && Math.min(x.bottom, y.bottom) - Math.max(x.top, y.top) > 1))) warnings.push(`overlap: ${label(a)} / ${label(b)}`)
  }
  const signature = element => {
    const s = getComputedStyle(element)
    return ['color', 'backgroundColor', 'borderColor', 'fontWeight', 'boxShadow', 'textDecorationLine', 'opacity'].map(k => s[k]).join('|')
  }
  for (const selector of ['[data-presentation-progress]', '[data-presentation-toc]']) {
    const root = document.querySelector(selector)
    if (!root || !visible(root)) continue
    const active = root.querySelector('[data-presentation-active="true"]'), inactive = root.querySelector('[data-presentation-active="false"]')
    if (active && inactive && signature(active) === signature(inactive)) warnings.push(`indistinct active chrome: ${selector}`)
  }
  const attribution = document.querySelector('[data-presentation-attribution]')
  if (!attribution || !visible(attribution)) warnings.push('missing attribution: style [data-presentation-attribution]')
  else {
    const s = getComputedStyle(attribution)
    if (parseFloat(s.fontSize) < 12 || (['rgb(0, 0, 238)', 'rgb(85, 26, 139)'].includes(s.color) && s.textDecorationLine.includes('underline'))) warnings.push('unpolished attribution: style [data-presentation-attribution]')
  }
  return warnings
}
