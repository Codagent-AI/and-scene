/**
 * Pure visual-diagnostic rules used by the inspection helper. Browser-side data
 * is gathered separately; these functions decide what is worth a warning.
 */

export function rectsIntersect(a, b) {
  const width = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x)
  const height = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y)
  return width > 1 && height > 1
}

/**
 * Reports overlaps between visible text or chrome items. Items are
 * `{ idx, label, rect, ancestors }`, where `ancestors` lists the idx of every
 * other item that contains this one. Containers and children are not collisions.
 */
export function overlapWarnings(step, items) {
  const warnings = []
  for (let i = 0; i < items.length; i += 1) {
    for (let j = i + 1; j < items.length; j += 1) {
      const a = items[i]
      const b = items[j]
      if (a.ancestors.includes(b.idx) || b.ancestors.includes(a.idx)) continue
      if (!rectsIntersect(a.rect, b.rect)) continue
      warnings.push({
        step,
        kind: 'overlap',
        message: `step ${step}: "${a.label}" overlaps "${b.label}"`,
        elements: [a.label, b.label],
      })
    }
  }
  return warnings
}

/** True when the active item looks the same as an inactive one. */
export function indistinctActive(activeStyle, inactiveStyle) {
  const keys = ['color', 'backgroundColor', 'borderColor', 'borderWidth', 'fontWeight', 'transform', 'textDecorationLine', 'boxShadow']
  return keys.every((key) => activeStyle[key] === inactiveStyle[key])
}

export const DEFAULT_LINK_COLOR = 'rgb(0, 0, 238)'
export const MIN_ATTRIBUTION_FONT_PX = 12

/** Returns an advisory message for a missing, undersized, or browser-default attribution link. */
export function attributionWarning(step, info) {
  if (!info.present) {
    return {
      step,
      kind: 'attribution',
      message: `step ${step}: attribution link [data-presentation-attribution] is missing; style it through its hook`,
      elements: ['data-presentation-attribution'],
    }
  }
  if (info.color === DEFAULT_LINK_COLOR || info.fontSizePx < MIN_ATTRIBUTION_FONT_PX) {
    return {
      step,
      kind: 'attribution',
      message: `step ${step}: attribution link is too small or browser-default; style [data-presentation-attribution]`,
      elements: ['data-presentation-attribution'],
    }
  }
  return null
}

export function chromeWarning(step, label) {
  return {
    step,
    kind: 'chrome',
    message: `step ${step}: active ${label} is visually indistinct from inactive ones; style [data-presentation-active="true"]`,
    elements: [label],
  }
}
