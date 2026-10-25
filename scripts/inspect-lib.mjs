// Pure analysis of data collected from the page by inspect-presentation.mjs.

/** Rectangles intersect by more than `min` px in both axes. */
export function rectsOverlap(a, b, min = 2) {
  const w = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)
  const h = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y)
  return w > min && h > min
}

/**
 * items: [{ name, rect:{x,y,w,h}, allowOverlap, ancestors: [name...] }]
 * Pairs where either side sits inside an allow-overlap subtree, or where one
 * contains the other in the DOM, are exempt.
 */
export function findOverlaps(items) {
  const out = []
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const a = items[i]
      const b = items[j]
      if (a.allowOverlap || b.allowOverlap) continue
      if (a.ancestors.includes(b.name) || b.ancestors.includes(a.name)) continue
      if (rectsOverlap(a.rect, b.rect)) out.push([a.name, b.name])
    }
  }
  return out
}

const DISTINCT_PROPS = [
  'backgroundColor',
  'color',
  'borderTopColor',
  'borderTopWidth',
  'outlineStyle',
  'width',
  'height',
  'opacity',
  'fontWeight',
  'textDecorationLine',
  'boxShadow',
  'transform',
]

/** Active chrome must differ from an inactive sibling in at least one visual property. */
export function isActiveDistinct(active, inactive) {
  return DISTINCT_PROPS.some((p) => active[p] !== inactive[p])
}

export const DEFAULT_LINK_COLOR = 'rgb(0, 0, 238)'
export const MIN_ATTRIBUTION_PX = 11

/** Reasons the attribution looks unpolished; empty when it looks intentional. */
export function attributionIssues(style) {
  const issues = []
  if (parseFloat(style.fontSize) < MIN_ATTRIBUTION_PX) issues.push(`font size ${style.fontSize} is below ${MIN_ATTRIBUTION_PX}px`)
  if (style.color === DEFAULT_LINK_COLOR) issues.push('uses the browser-default link color')
  if (/times/i.test(style.fontFamily)) issues.push('uses the browser-default serif font')
  return issues
}
