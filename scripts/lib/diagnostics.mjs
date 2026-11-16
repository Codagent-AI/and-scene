// Pure decisions kept separate from browser DOM collection for focused tests.
export function diagnose(elements, attribution, step) {
  const warnings = []
  const visible = elements.filter(e => e.visible && !e.allowed && (e.text || e.chrome))
  for (let i = 0; i < visible.length; i++) for (let j = i + 1; j < visible.length; j++) {
    const a = visible[i], b = visible[j]
    if (a.ancestors.includes(b.id) || b.ancestors.includes(a.id)) continue
    if (Math.min(a.right, b.right) - Math.max(a.left, b.left) > 2 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 2) warnings.push(`step ${step}: overlap ${a.id} ↔ ${b.id}`)
  }
  for (const kind of ['progress', 'toc']) {
    const controls = elements.filter(e => e.visible && e.kind === kind)
    const current = controls.find(e => e.active)
    const inactive = controls.filter(e => !e.active)
    if (current && inactive.some(e => e.signature === current.signature)) warnings.push(`step ${step}: indistinct active ${kind} chrome`)
  }
  if (!attribution || !attribution.visible || attribution.size < 11 || attribution.browserDefault) warnings.push(`step ${step}: unpolished attribution; style [data-presentation-attribution]`)
  return warnings
}
export function collectVisualState() {
  const all = [...document.querySelectorAll('[data-presentation] *')]
  const ids = new Map(all.map((el, i) => [el, el.getAttribute('data-entity') || el.getAttribute('aria-label') || `${el.tagName.toLowerCase()}-${i}`]))
  const visible = el => {
    const style = getComputedStyle(el), r = el.getBoundingClientRect()
    return r.width > 0 && r.height > 0 && style.visibility !== 'hidden' && style.display !== 'none' && Number(style.opacity) > 0 && el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })
  }
  const elements = all.map(el => {
    const style = getComputedStyle(el), r = el.getBoundingClientRect()
    const ancestors = []; for (let p = el.parentElement; p; p = p.parentElement) if (ids.has(p)) ancestors.push(ids.get(p))
    return { id: ids.get(el), ancestors, left: r.left, right: r.right, top: r.top, bottom: r.bottom,
      visible: visible(el), allowed: !!el.closest('[data-presentation-allow-overlap]'), text: [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()),
      chrome: el.matches('button, [data-presentation-caption], [data-presentation-attribution]'),
      kind: el.hasAttribute('data-presentation-progress-entry') ? 'progress' : el.hasAttribute('data-presentation-toc-entry') ? 'toc' : '',
      active: el.getAttribute('data-presentation-active') === 'true',
      signature: [style.color, style.backgroundColor, style.fontWeight, style.borderColor, style.borderWidth, style.boxShadow, style.textDecoration, style.opacity].join('|') }
  })
  const link = document.querySelector('[data-presentation-attribution]')
  const style = link && getComputedStyle(link)
  return { elements, attribution: link && { visible: visible(link), size: parseFloat(style.fontSize), browserDefault: ['rgb(0, 0, 238)', 'rgb(85, 26, 139)'].includes(style.color) } }
}
export async function captureSettled(page, path, settle) {
  await page.waitForTimeout(settle)
  await page.screenshot({ path, fullPage: true })
}
