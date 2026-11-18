// Runs inside Chromium via page.evaluate. Keep this function self-contained.
export function collectDiagnostics() {
  const visible = el => {
    const rect = el.getBoundingClientRect(), style = getComputedStyle(el)
    return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && Number(style.opacity) > 0
  }
  const name = el => el.getAttribute('aria-label') || el.getAttribute('data-presentation-entity') || el.textContent.trim().slice(0, 70) || el.tagName
  const warnings = []
  // Report display pixels, not the unscaled design-space CSS font size.
  // Intentional-overlap markers cannot exempt unreadably small text.
  for (const canvas of document.querySelectorAll('[data-presentation-canvas]')) {
    const scale = Number(canvas.getAttribute('data-scale'))
    if (!Number.isFinite(scale) || scale <= 0) continue
    for (const el of canvas.querySelectorAll('*')) {
      if (!visible(el) || ![...el.childNodes].some(n => n.nodeType === Node.TEXT_NODE && n.textContent.trim())) continue
      const displayed = parseFloat(getComputedStyle(el).fontSize) * scale
      if (displayed < 12) warnings.push(`small scene text: ${name(el)} displays at ${displayed.toFixed(1)}px; enlarge presentation-owned type or simplify the fixed composition`)
    }
  }
  const isControl = el => el.matches('button, a, input, select, textarea, [role="button"]')
  const text = [...document.querySelectorAll('[data-presentation] *')].filter(el => visible(el) && (isControl(el) || [...el.childNodes].some(n => n.nodeType === Node.TEXT_NODE && n.textContent.trim())) && !el.closest('[data-presentation-allow-overlap]'))
  // Use text ranges, not enclosing cards or paragraphs that contain unused space.
  const rects = el => isControl(el) ? [el.getBoundingClientRect()] : [...el.childNodes].filter(n => n.nodeType === Node.TEXT_NODE && n.textContent.trim()).flatMap(n => { const r = document.createRange(); r.selectNodeContents(n); return [...r.getClientRects()] })
  for (let i = 0; i < text.length; i++) for (let j = i + 1; j < text.length; j++) {
    if (text[i].contains(text[j]) || text[j].contains(text[i])) continue
    if (rects(text[i]).some(a => rects(text[j]).some(b => Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1))) warnings.push(`overlap: ${name(text[i])} / ${name(text[j])}`)
  }
  const signature = el => {
    const s = getComputedStyle(el)
    return [s.color, s.backgroundColor, s.borderColor, s.borderWidth, s.fontWeight, s.fontSize, s.fontStyle, s.letterSpacing, s.textTransform, s.width, s.height, s.borderStyle, s.textDecorationLine, s.boxShadow, s.opacity, s.transform].join('|')
  }
  for (const hook of ['progress', 'toc']) {
    const controls = [...document.querySelectorAll(`[data-presentation-${hook}] [data-presentation-active]`)].filter(visible)
    const active = controls.find(el => el.dataset.presentationActive === 'true')
    const inactive = controls.find(el => el.dataset.presentationActive === 'false')
    if (active && inactive && signature(active) === signature(inactive)) warnings.push(`indistinct active ${hook}: style [data-presentation-active="true"]`)
  }
  const attribution = document.querySelector('[data-presentation-attribution] a')
  if (!attribution || !visible(attribution)) warnings.push('missing attribution: style [data-presentation-attribution]')
  else {
    const s = getComputedStyle(attribution)
    if (parseFloat(s.fontSize) < 11 || (['rgb(0, 0, 238)', 'rgb(85, 26, 139)'].includes(s.color) && s.textDecorationLine.includes('underline'))) warnings.push('unpolished attribution: style [data-presentation-attribution]')
  }
  return warnings
}
