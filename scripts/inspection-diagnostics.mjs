export async function inspectStep(page, index) {
  const warnings = await page.evaluate(() => {
    const visible = [...document.querySelectorAll('[data-presentation] *, [data-presentation-attribution]')].filter((el) => {
      const rect = el.getBoundingClientRect(), style = getComputedStyle(el)
      return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none' && el.children.length === 0 && el.textContent?.trim()
    })
    const collisions = []
    for (let a = 0; a < visible.length; a++) for (let b = a + 1; b < visible.length; b++) {
      const x = visible[a].getBoundingClientRect(), y = visible[b].getBoundingClientRect()
      if (x.left < y.right && x.right > y.left && x.top < y.bottom && x.bottom > y.top && !visible[a].closest('[data-allow-overlap]') && !visible[b].closest('[data-allow-overlap]')) collisions.push(`${visible[a].textContent.trim()} / ${visible[b].textContent.trim()}`)
    }
    const active = [...document.querySelectorAll('[data-presentation-progress-item][data-active="true"], [data-presentation-toc-item][data-active="true"]')]
    const inactive = [...document.querySelectorAll('[data-presentation-progress-item][data-active="false"], [data-presentation-toc-item][data-active="false"]')]
    const indistinct = active.length && inactive.length && active.every((node) => {
      const a = getComputedStyle(node), b = getComputedStyle(inactive[0])
      return a.color === b.color && a.backgroundColor === b.backgroundColor && a.borderColor === b.borderColor && a.opacity === b.opacity && a.fontWeight === b.fontWeight
    })
    const attribution = document.querySelector('[data-presentation-attribution]')
    const attrStyle = attribution && getComputedStyle(attribution)
    return { collisions, indistinct: Boolean(indistinct), attribution: !attribution || !attrStyle || parseFloat(attrStyle.fontSize) < 11 || attrStyle.textDecorationLine.includes('underline') && attrStyle.color === 'rgb(0, 0, 238)' }
  })
  return [
    ...warnings.collisions.map((collision) => `WARN step ${index}: possible text overlap: ${collision}`),
    ...(warnings.indistinct ? [`WARN step ${index}: active progress/ToC state is not visually distinct`] : []),
    ...(warnings.attribution ? [`WARN step ${index}: attribution is missing, browser-default, or undersized; style [data-presentation-attribution]`] : []),
  ]
}

export async function captureSettledStep(page, index, path, settleMs = 700) {
  await page.waitForTimeout(settleMs)
  await page.screenshot({ path, fullPage: true })
  return inspectStep(page, index)
}
