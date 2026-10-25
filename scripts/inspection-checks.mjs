// Pure visual-quality checks over plain data collected from the page. Advisory only.

const DEFAULT_LINK_COLORS = new Set(['rgb(0, 0, 238)', 'rgb(85, 26, 139)', 'rgb(0, 0, 255)'])
const MIN_ATTRIBUTION_FONT_PX = 11
const MIN_OVERLAP_PX = 3

export function intersection(a, b) {
  const w = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)
  const h = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y)
  return w > 0 && h > 0 ? { w, h } : null
}

/**
 * items: [{ label, rect: {x,y,w,h}, rects?: {x,y,w,h}[], allowed: boolean, ancestors: number[] }]
 * `rects` are an item's per-line boxes (wrapped text); they are compared instead of the one union
 * `rect`, whose bounding box spans the blank space around wrapped lines. Items inside an allow-overlap subtree never produce warnings; `ancestors`
 * lists item indexes that contain the item so containment is not a collision.
 */
const boxesOf = (item) => (item.rects?.length ? item.rects : [item.rect])

export function findOverlaps(items) {
  const found = []
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const a = items[i]
      const b = items[j]
      if (a.allowed || b.allowed) continue
      if (a.ancestors?.includes(j) || b.ancestors?.includes(i)) continue
      const collides = boxesOf(a).some((ra) =>
        boxesOf(b).some((rb) => {
          const hit = intersection(ra, rb)
          return hit && hit.w >= MIN_OVERLAP_PX && hit.h >= MIN_OVERLAP_PX
        }),
      )
      if (collides) found.push([a.label, b.label])
    }
  }
  return found
}

const DISTINCT_PROPS = [
  'backgroundColor',
  'color',
  'borderTopColor',
  'borderTopWidth',
  'fontWeight',
  'opacity',
  'transform',
  'boxShadow',
  'outlineStyle',
  'textDecorationLine',
  'size',
]

/**
 * Active chrome must differ from an inactive sibling in at least one visible property.
 * `size` is only set for text-less controls (dots), where text length cannot change the box.
 */
export function isActiveDistinct(active, inactive) {
  return DISTINCT_PROPS.some((p) => active[p] !== inactive[p])
}

/** Reasons the attribution looks unpolished; empty when it is fine. */
export function attributionIssues(attr) {
  if (!attr) return ['attribution link is missing']
  const issues = []
  if (attr.fontSize < MIN_ATTRIBUTION_FONT_PX) issues.push(`font size ${attr.fontSize}px is too small`)
  if (DEFAULT_LINK_COLORS.has(attr.color)) issues.push('uses the browser-default link color')
  if (/^"?times/i.test(attr.fontFamily)) issues.push('uses the browser-default font')
  if (attr.rect.w < 24 || attr.rect.h < 8) issues.push('rendered size is too small')
  return issues
}
