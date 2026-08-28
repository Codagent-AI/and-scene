function overlaps(first, second) {
  return first.left < second.right && first.right > second.left && first.top < second.bottom && first.bottom > second.top
}

export function assertPresentationSlug(slug) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error('invalid presentation slug')
  return slug
}

export function inspectStep({ activeStyles, attribution, elements }) {
  const warnings = []
  for (let firstIndex = 0; firstIndex < elements.length; firstIndex += 1) {
    for (let secondIndex = firstIndex + 1; secondIndex < elements.length; secondIndex += 1) {
      const first = elements[firstIndex]
      const second = elements[secondIndex]
      const sharesOverlapRegion = first?.overlapRegion && first.overlapRegion === second?.overlapRegion
      if (!first || !second || sharesOverlapRegion || !overlaps(first.rect, second.rect)) continue
      warnings.push(`overlap: ${first.id} and ${second.id}`)
    }
  }
  if (activeStyles.some(({ active, inactive }) => active === inactive)) warnings.push('active chrome is visually indistinct')
  if (!attribution.present || attribution.fontSize < 12 || attribution.browserDefault) warnings.push('attribution is browser-default or undersized')
  return warnings
}
