const collisionThreshold = 4

function overlaps(first, second) {
  return Math.min(first.rect.right, second.rect.right) - Math.max(first.rect.left, second.rect.left) > collisionThreshold
    && Math.min(first.rect.bottom, second.rect.bottom) - Math.max(first.rect.top, second.rect.top) > collisionThreshold
}

export function overlapWarnings(candidates, step) {
  const warnings = []
  for (let first = 0; first < candidates.length; first += 1) {
    for (let second = first + 1; second < candidates.length; second += 1) {
      if (candidates[first].allowed || candidates[second].allowed || !overlaps(candidates[first], candidates[second])) continue
      warnings.push(`inspect: advisory step ${step}: ${candidates[first].label} overlaps ${candidates[second].label}; mark only intentional readable compositions with data-presentation-allow-overlap`)
    }
  }
  return warnings
}

export function stylesAreIndistinct(active, inactive) {
  return active.color === inactive.color
    && active.backgroundColor === inactive.backgroundColor
    && active.borderColor === inactive.borderColor
}

export function attributionWarning(attribution) {
  if (!attribution) return 'inspect: advisory: attribution is missing; render and style [data-presentation-attribution] locally'
  if (attribution.fontSize < 10 || attribution.color === 'rgb(0, 0, 238)') {
    return 'inspect: advisory: attribution is browser-default or undersized; style [data-presentation-attribution] locally'
  }
  return null
}
