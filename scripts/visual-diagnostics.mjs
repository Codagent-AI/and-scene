// Elements under [data-presentation-allow-overlap] opt out of overlap advisories.
export function inspectVisualComposition() {
  const allowed = (element) => Boolean(element.closest('[data-presentation-allow-overlap]'))
  const describe = (element) => `${element.tagName.toLowerCase()}${element.id ? `#${element.id}` : ''}${typeof element.className === 'string' && element.className ? `.${element.className.trim().split(/\s+/).join('.')}` : ''}`
  const isVisibleText = (element) => {
    const style = getComputedStyle(element)
    return element.childElementCount === 0 && style.visibility !== 'hidden' && style.display !== 'none' && Boolean(element.textContent?.trim())
  }
  const scene = document.querySelector('[data-presentation-scene]') ?? document.querySelector('[data-presentation-layer]')
  const sceneText = scene ? [...scene.querySelectorAll('*')].filter(isVisibleText) : []
  const chrome = [...document.querySelectorAll('[data-presentation-header], [data-presentation-footer], [data-presentation-toc]')]
  const chromeText = chrome.flatMap((root) => [...root.querySelectorAll('*')].filter(isVisibleText))
  const overlaps = []
  for (const a of sceneText) for (const b of chromeText) {
    const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect()
    if (ra.width && ra.height && rb.width && rb.height && ra.left < rb.right && ra.right > rb.left && ra.top < rb.bottom && ra.bottom > rb.top && !allowed(a) && !allowed(b)) overlaps.push(`${describe(a)} overlaps ${describe(b)}`)
  }
  const activeControls = [...document.querySelectorAll('[data-presentation-progress] [data-presentation-active="true"], [data-presentation-toc] [data-presentation-active="true"]')]
  const indistinct = activeControls.filter((active) => {
    const inactive = active.parentElement?.querySelector('[data-presentation-active="false"]')
    const a = getComputedStyle(active), b = inactive && getComputedStyle(inactive)
    return !b || (a.color === b.color && a.backgroundColor === b.backgroundColor && a.opacity === b.opacity && a.fontWeight === b.fontWeight && a.textDecorationLine === b.textDecorationLine && a.outlineStyle === b.outlineStyle)
  }).map(describe)
  const attribution = document.querySelector('[data-presentation-attribution]')
  const style = attribution && getComputedStyle(attribution)
  const browserDefault = attribution instanceof HTMLAnchorElement && (style?.color === 'rgb(0, 0, 238)' || style?.textDecorationLine.includes('underline'))
  const polishedAttribution = Boolean(attribution && style && Number.parseFloat(style.fontSize) >= 12 && !/Times New Roman/i.test(style.fontFamily) && !browserDefault)
  return { overlaps: [...new Set(overlaps)], indistinct, polishedAttribution }
}
