export function diagnose({ text = [], active = [], attribution }, step) {
  const warnings = []
  const intersects = (a, b) => Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1
  for (let i = 0; i < text.length; i++) for (let j = i + 1; j < text.length; j++) {
    if (!text[i].allowed && !text[j].allowed && text[i].owner !== text[j].owner && intersects(text[i], text[j])) warnings.push(`step ${step}: overlap ${text[i].owner} / ${text[j].owner}`)
  }
  for (const control of active) if (control.current === control.inactive) warnings.push(`step ${step}: indistinct active ${control.owner}`)
  if (!attribution || attribution.size < 11 || (attribution.color === 'rgb(0, 0, 238)' && attribution.decoration.includes('underline'))) warnings.push(`step ${step}: style [data-presentation-attribution]: missing, undersized or browser-default attribution`)
  return warnings
}
// Executed in the page; deliberately self-contained so Playwright can serialize it.
export function readVisualState() {
  const visible = el => { const s = getComputedStyle(el); const r = el.getBoundingClientRect(); return s.visibility !== 'hidden' && s.display !== 'none' && Number(s.opacity) > 0 && r.width > 0 && r.height > 0 }
  const owner = el => el.closest('[data-entity]')?.getAttribute('data-entity') || `${el.tagName.toLowerCase()}[${Array.from(el.attributes).find(a => a.name.startsWith('data-presentation'))?.name || el.textContent.trim().slice(0, 45)}]`
  const text = []
  const walker = document.createTreeWalker(document.querySelector('[data-presentation]'), NodeFilter.SHOW_TEXT)
  while (walker.nextNode()) {
    const node = walker.currentNode
    const el = node.parentElement
    if (!node.textContent.trim() || !visible(el)) continue
    const range = document.createRange(); range.selectNodeContents(node)
    for (const r of range.getClientRects()) if (r.width && r.height) text.push({ left: r.left, right: r.right, top: r.top, bottom: r.bottom, owner: owner(el), allowed: !!el.closest('[data-presentation-allow-overlap]') })
  }
  const signature = el => {
    const s = getComputedStyle(el)
    return [s.color, s.backgroundColor, s.borderColor, s.fontWeight, s.textDecoration, s.boxShadow, s.opacity, s.outline, s.transform].join('|')
  }
  const active = []
  for (const selector of ['[data-presentation-progress]', '[data-presentation-toc]']) {
    const root = document.querySelector(selector)
    const current = root?.querySelector('[data-presentation-active="true"]')
    const inactive = root?.querySelector('[data-presentation-active="false"]')
    if (current && inactive && visible(current)) active.push({ owner: selector, current: signature(current), inactive: signature(inactive) })
  }
  const link = document.querySelector('[data-presentation-attribution]')
  const style = link && getComputedStyle(link)
  return { text, active, attribution: link && visible(link) ? { size: parseFloat(style.fontSize), color: style.color, decoration: style.textDecorationLine } : null }
}
