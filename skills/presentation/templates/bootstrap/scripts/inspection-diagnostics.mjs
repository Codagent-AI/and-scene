// Pure geometry/style helpers shared by the inspection browser and its tests.
export function overlapArea(a, b) {
  return Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) *
    Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top))
}

export function isOverlapAllowed(firstAllowed, secondAllowed) {
  return Boolean(firstAllowed || secondAllowed)
}

export function stylesDistinct(active, inactive) {
  return ['color', 'backgroundColor', 'fontSize', 'fontWeight', 'opacity', 'textDecorationLine', 'borderColor', 'outlineColor']
    .some((key) => active[key] !== inactive[key])
}

export function attributionIssues(style, rect, link) {
  const issues = []
  if (Number.parseFloat(style.fontSize) < 12 || rect.width < 44 || rect.height < 20) issues.push('too small (minimum 12px text and 44×20px hit area)')
  if (link && style.color === 'rgb(0, 0, 238)' && style.textDecorationLine.includes('underline')) issues.push('browser-default link styling')
  return issues
}
