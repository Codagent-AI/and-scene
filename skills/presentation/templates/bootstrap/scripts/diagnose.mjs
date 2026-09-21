// Runs both in Node (unit tests inject `doc`/`computedStyle`) and inside the page
// via page.evaluate, so it must stay self-contained and free of module-scope refs.
export function diagnose(step, doc = document, computedStyle = getComputedStyle) {
  const result = []
  const at = `step ${step + 1}`
  // Scene decoration (connectors, emphasis, frames) overlaps by construction, so
  // only text and chrome are overlap candidates. Authors exempt a deliberately
  // overlapping subtree with data-presentation-overlap-allowed.
  const candidates = [...doc.querySelectorAll('[data-presentation-caption], [data-presentation-header], [data-presentation-controls], [data-presentation-toc], [data-presentation-node="box"], [data-presentation-node="label"], [data-presentation-node="symbol-chip"], [data-presentation-attribution]')]
    .map((element) => ({ element, box: element.getBoundingClientRect(), hidden: computedStyle(element).visibility === 'hidden', allowed: Boolean(element.closest('[data-presentation-overlap-allowed]')) }))
    .filter((candidate) => candidate.box.width > 0 && candidate.box.height > 0 && !candidate.hidden)
  for (let i = 0; i < candidates.length; i += 1) {
    if (candidates[i].allowed) continue
    for (let j = i + 1; j < candidates.length; j += 1) {
      const a = candidates[i].box; const b = candidates[j].box
      if (!candidates[j].allowed && a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top) result.push(`${at}: visible chrome/text overlap between ${candidates[i].element.className} and ${candidates[j].element.className}`)
    }
  }
  const active = doc.querySelector('[data-presentation-progress-item][aria-current="step"], [data-presentation-toc-item][aria-current="step"]')
  const inactive = doc.querySelector('[data-presentation-progress-item]:not([aria-current="step"]), [data-presentation-toc-item]:not([aria-current="step"])')
  if (!active) result.push(`${at}: active navigation state is missing`)
  else if (inactive) {
    const activeStyle = computedStyle(active); const inactiveStyle = computedStyle(inactive)
    if (activeStyle.color === inactiveStyle.color && activeStyle.backgroundColor === inactiveStyle.backgroundColor) result.push(`${at}: active navigation state is visually indistinct`)
  }
  const attribution = doc.querySelector('[data-presentation-attribution]')
  if (!attribution) result.push(`${at}: attribution is missing`)
  else {
    const attributionStyle = computedStyle(attribution)
    if (parseFloat(attributionStyle.fontSize) < 11 || attributionStyle.color === 'rgb(0, 0, 238)') result.push(`${at}: attribution is too small or browser-default; style [data-presentation-attribution]`)
  }
  return result
}
