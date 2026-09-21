// Runs both in Node (unit tests inject `doc`/`computedStyle`) and inside the page
// via page.evaluate, so it must stay self-contained and free of module-scope refs.
export function diagnose(step, doc = document, computedStyle = getComputedStyle) {
  const result = []
  const visible = [...doc.querySelectorAll('[data-presentation-caption], [data-presentation-header], [data-presentation-controls], [data-presentation-toc], [data-presentation-node], [data-presentation-attribution]')].filter((element) => {
    const box = element.getBoundingClientRect(); return box.width > 0 && box.height > 0 && computedStyle(element).visibility !== 'hidden'
  })
  const allowed = (element) => element.closest('[data-presentation-overlap-allowed]')
  for (let i = 0; i < visible.length; i += 1) for (let j = i + 1; j < visible.length; j += 1) {
    const a = visible[i].getBoundingClientRect(); const b = visible[j].getBoundingClientRect()
    if (!allowed(visible[i]) && !allowed(visible[j]) && a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top) result.push(`step ${step + 1}: visible chrome/text overlap between ${visible[i].className} and ${visible[j].className}`)
  }
  const active = doc.querySelector('[data-presentation-progress-item][aria-current="step"], [data-presentation-toc-item][aria-current="step"]')
  const inactive = doc.querySelector('[data-presentation-progress-item]:not([aria-current="step"]), [data-presentation-toc-item]:not([aria-current="step"])')
  if (!active) result.push(`step ${step + 1}: active navigation state is missing`)
  else if (inactive && computedStyle(active).color === computedStyle(inactive).color && computedStyle(active).backgroundColor === computedStyle(inactive).backgroundColor) result.push(`step ${step + 1}: active navigation state is visually indistinct`)
  const attribution = doc.querySelector('[data-presentation-attribution]')
  if (!attribution) result.push(`step ${step + 1}: attribution is missing`)
  else if (parseFloat(computedStyle(attribution).fontSize) < 11 || computedStyle(attribution).color === 'rgb(0, 0, 238)') result.push(`step ${step + 1}: attribution is too small or browser-default; style [data-presentation-attribution]`)
  return result
}
