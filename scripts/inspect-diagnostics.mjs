/** Runs in the page so fixture pages can exercise the same browser measurements. */
export function inspectDiagnostics() {
  const result = []
  const texts = [...document.querySelectorAll('[data-presentation] :is(h1,h2,h3,p,a,button,[data-presentation-caption],[data-presentation-live-title],[data-presentation-node])')].filter((el) => el.getClientRects().length)
  const rect = (el) => el.getBoundingClientRect()
  const label = (el) => `${el.tagName.toLowerCase()}${el.className && typeof el.className === 'string' ? `.${el.className.trim().replaceAll(' ', '.')}` : ''} (${(el.textContent || '').trim().replaceAll('\n', ' ').slice(0, 36)})`
  for (let i = 0; i < texts.length; i++) for (let j = i + 1; j < texts.length; j++) {
    if (texts[i].contains(texts[j]) || texts[j].contains(texts[i]) || texts[i].closest('[data-allow-overlap]') || texts[j].closest('[data-allow-overlap]')) continue
    const a = rect(texts[i]), b = rect(texts[j])
    if (a.width && a.height && b.width && b.height && a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top) result.push(`possible visible text/chrome overlap: ${label(texts[i])} ↔ ${label(texts[j])}`)
  }
  for (const el of document.querySelectorAll('[data-presentation-active="true"]')) {
    const css = getComputedStyle(el), inactive = el.parentElement?.querySelector('[data-presentation-active="false"]')
    if (inactive && css.color === getComputedStyle(inactive).color && css.backgroundColor === getComputedStyle(inactive).backgroundColor && css.fontWeight === getComputedStyle(inactive).fontWeight) result.push('active navigation may look like inactive controls')
  }
  const attribution = document.querySelector('[data-presentation-attribution]')
  if (!attribution) result.push('missing attribution')
  else {
    const link = attribution.querySelector('a')
    const css = getComputedStyle(link || attribution)
    if (!link || Number.parseFloat(css.fontSize) < 11 || css.textDecorationLine.includes('underline')) result.push('attribution may be browser-default or too small')
  }
  return [...new Set(result)]
}
