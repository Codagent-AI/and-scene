// Pure decision logic for the screenshot helper's advisory warnings. The page
// collector (collect.mjs) gathers plain data; everything here works on that data.

export const MIN_OVERLAP_PX = 2
export const MIN_ATTRIBUTION_FONT_PX = 11
const BROWSER_DEFAULT_LINK_COLORS = new Set(['rgb(0, 0, 238)', 'rgb(85, 26, 139)', 'rgb(0, 0, 255)'])

export function rectsOverlap(a, b, min = MIN_OVERLAP_PX) {
  const w = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x)
  const h = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y)
  return w > min && h > min
}

/**
 * items: { id, label, rect, allowOverlap, ancestors: number[] } — `ancestors` are ids of
 * other items that contain this one in the DOM. Hidden (zero-size) items, ancestor
 * pairs, and anything inside an allow-overlap subtree are skipped.
 */
export function findOverlaps(items) {
  const visible = items.filter((i) => i.rect.width > 0 && i.rect.height > 0)
  const found = []
  for (let a = 0; a < visible.length; a++) {
    for (let b = a + 1; b < visible.length; b++) {
      const x = visible[a]
      const y = visible[b]
      if (x.allowOverlap || y.allowOverlap) continue
      if (x.ancestors.includes(y.id) || y.ancestors.includes(x.id)) continue
      if (rectsOverlap(x.rect, y.rect)) found.push([x.label, y.label])
    }
  }
  return found
}

const STYLE_KEYS = [
  'color', 'backgroundColor', 'borderTopColor', 'borderTopWidth', 'outlineStyle', 'outlineColor', 'opacity',
  'fontWeight', 'textDecorationLine', 'transform', 'width', 'height', 'boxShadow',
]

export function styleSignature(style) {
  return STYLE_KEYS.map((k) => `${k}=${style[k]}`).join(';')
}

/**
 * group: { name, controls: [{ active: boolean, style }] }. Returns a message when the
 * active control looks the same as an inactive one, else null.
 */
export function indistinctActive(group) {
  const active = group.controls.find((c) => c.active)
  const inactive = group.controls.filter((c) => !c.active)
  if (!active || inactive.length === 0) return null
  const signature = styleSignature(active.style)
  return inactive.some((c) => styleSignature(c.style) === signature)
    ? `active ${group.name} looks the same as an inactive one`
    : null
}

/** attribution: null when missing, else { fontSize, color, width, height }. */
export function attributionProblems(attribution) {
  if (!attribution) return ['attribution link is missing']
  const problems = []
  if (attribution.fontSize < MIN_ATTRIBUTION_FONT_PX || attribution.height < 10 || attribution.width < 40) {
    problems.push(`attribution is too small (${attribution.fontSize}px text, ${Math.round(attribution.width)}x${Math.round(attribution.height)}px box)`)
  }
  if (BROWSER_DEFAULT_LINK_COLORS.has(attribution.color)) {
    problems.push(`attribution uses the browser-default link color ${attribution.color}`)
  }
  return problems
}

/** Turns one step's collected page data into warning records. */
export function diagnoseStep(step, data) {
  const warnings = []
  for (const [a, b] of findOverlaps(data.items)) {
    warnings.push({ step, kind: 'overlap', message: `${a} overlaps ${b}` })
  }
  for (const group of data.activeGroups) {
    const message = indistinctActive(group)
    if (message) warnings.push({ step, kind: 'active-chrome', message })
  }
  for (const message of attributionProblems(data.attribution)) {
    warnings.push({ step, kind: 'attribution', message: `${message}; style the [data-presentation-attribution] hook` })
  }
  return warnings
}

export function formatWarning(w) {
  return `[inspect] WARN step ${w.step} ${w.kind}: ${w.message}`
}
