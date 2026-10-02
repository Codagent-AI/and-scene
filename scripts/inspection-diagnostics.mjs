export async function inspectWarnings(page) {
  return page.evaluate(() => {
    const root = document.querySelector('[data-presentation]')
    if (!root) return ['missing presentation root']
    const visible = [...root.querySelectorAll('*')].filter((el) => {
      const rect = el.getBoundingClientRect(), style = getComputedStyle(el)
      return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none' && el.innerText?.trim() && ![...el.children].some((child) => child.innerText?.trim())
    })
    const overlaps = []
    for (let a = 0; a < visible.length; a++) for (let b = a + 1; b < visible.length; b++) {
      const first = visible[a], second = visible[b]
      if (first.closest('[data-allow-overlap]') || second.closest('[data-allow-overlap]')) continue
      const x = first.getBoundingClientRect(), y = second.getBoundingClientRect()
      if (x.left < y.right && x.right > y.left && x.top < y.bottom && x.bottom > y.top) overlaps.push(`${first.getAttribute('data-scene-entity') || first.getAttribute('class') || first.tagName} / ${second.getAttribute('data-scene-entity') || second.getAttribute('class') || second.tagName}`)
    }
    const warnings = overlaps.length ? [`visible text/chrome overlap: ${[...new Set(overlaps)].join(', ')}`] : []
    const active = [...root.querySelectorAll('[aria-current="step"], [aria-current="location"]')]
    for (const item of active) {
      const inactive = [...root.querySelectorAll('[data-presentation-progress-item], [data-presentation-toc-item]')].find((node) => node !== item && node.getAttribute('aria-current') === null && node.getBoundingClientRect().width > 0)
      if (!inactive) continue
      const a = getComputedStyle(item), b = getComputedStyle(inactive), x = item.getBoundingClientRect(), y = inactive.getBoundingClientRect()
      if (a.color === b.color && a.backgroundColor === b.backgroundColor && a.fontWeight === b.fontWeight && Math.abs(x.width - y.width) < 3) warnings.push('active progress or table-of-contents state may be visually indistinct')
      break
    }
    const attribution = root.querySelector('[data-presentation-attribution]')
    if (!attribution) warnings.push('missing attribution')
    else {
      const style = getComputedStyle(attribution), rect = attribution.getBoundingClientRect()
      if (parseFloat(style.fontSize) < 12 || rect.height < 12 || (style.textDecorationLine.includes('underline') && style.color === 'rgb(0, 0, 238)')) warnings.push('attribution may be browser-default or undersized; style [data-presentation-attribution]')
    }
    return [...new Set(warnings)]
  })
}
