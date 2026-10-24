// Pure analysers for the advisory visual diagnostics. They consume the
// snapshot produced by `collectSnapshot` (snapshot.mjs) and return warnings.

const OVERLAP_MIN_PX = 2
const MIN_ATTRIBUTION_FONT_PX = 12
const BROWSER_DEFAULT_LINK_COLORS = new Set(['rgb(0, 0, 238)', 'rgb(158, 158, 255)'])

function intersects(a, b) {
  const w = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)
  const h = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y)
  return w > OVERLAP_MIN_PX && h > OVERLAP_MIN_PX
}

/**
 * Visible text/chrome elements that overlap without an allow-overlap marker.
 * Elements: `{ id, label, rect, ancestors: id[], allowed }`.
 */
export function findOverlaps(elements) {
  const warnings = []
  for (let i = 0; i < elements.length; i++) {
    for (let j = i + 1; j < elements.length; j++) {
      const a = elements[i]
      const b = elements[j]
      if (a.allowed || b.allowed) continue
      if (a.ancestors.includes(b.id) || b.ancestors.includes(a.id)) continue
      if (intersects(a.rect, b.rect)) warnings.push({ a: a.label, b: b.label })
    }
  }
  return warnings
}

function signature(style) {
  return JSON.stringify(style)
}

/**
 * Groups (`progress`, `toc`) whose active item looks identical to every
 * inactive item. Groups: `{ name, items: [{ active, style }] }`.
 */
export function findIndistinctActive(groups) {
  const warnings = []
  for (const group of groups) {
    const active = group.items.filter((i) => i.active)
    const inactive = group.items.filter((i) => !i.active)
    if (active.length === 0 || inactive.length === 0) continue
    const same = inactive.every((i) => signature(i.style) === signature(active[0].style))
    if (same) warnings.push({ chrome: group.name })
  }
  return warnings
}

/**
 * Attribution problems: missing, too small, or browser-default.
 * `attribution` is `null` or `{ fontSize, color, height }`.
 */
export function findAttributionIssues(attribution) {
  if (!attribution) return ['attribution link is missing']
  const issues = []
  if (attribution.fontSize < MIN_ATTRIBUTION_FONT_PX || attribution.height < 16) {
    issues.push(`attribution link is too small (${attribution.fontSize}px)`)
  }
  if (BROWSER_DEFAULT_LINK_COLORS.has(attribution.color)) {
    issues.push('attribution link uses the browser-default link colour')
  }
  return issues
}

export const ATTRIBUTION_HINT = 'style it via the [data-presentation-attribution] hook'
