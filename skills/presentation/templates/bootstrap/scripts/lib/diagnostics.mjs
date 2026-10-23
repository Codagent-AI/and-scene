// Pure helpers behind the screenshot helper's advisory warnings.
import fs from 'node:fs'
import path from 'node:path'

export const MIN_OVERLAP_AREA = 4 // px², intersections at or below this are ignored
export const MIN_ATTRIBUTION_FONT_PX = 11
export const BROWSER_DEFAULT_LINK_COLOR = 'rgb(0, 0, 238)'
export const DEFAULT_SETTLE_MS = 1200

export function intersectionArea(a, b) {
  const w = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)
  const h = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y)
  return w > 0 && h > 0 ? w * h : 0
}

/**
 * `items`: visible text/chrome elements as `{ id, rect, allowed }`, where `rect` is the
 * element's own text range. An item that paints a background or border also has `cover`,
 * its box, `within`, the indices of items that contain it, and `above`, the indices of
 * items whose text it is painted over. `allowed` is true inside a
 * `data-presentation-allow-overlap` subtree. Only the explicit marker exempts a pair:
 * nested elements are measured by their own text ranges, so a nested collision is as
 * suspicious as any other. A painted box hiding another item's text is a collision too,
 * except for text inside that box, which it contains by construction, and text painted
 * on top of the box.
 */
function coverArea(a, b) {
  if (!a.cover || (b.within ?? []).includes(a.index) || !(a.above ?? []).includes(b.index)) return 0
  return intersectionArea(a.cover, b.rect)
}

export function overlapWarnings(items, step) {
  const warnings = []
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const a = items[i]
      const b = items[j]
      if (a.allowed || b.allowed) continue
      const direct = intersectionArea(a.rect, b.rect)
      const covered = Math.max(coverArea(a, b), coverArea(b, a))
      const area = Math.max(direct, covered)
      if (area > MIN_OVERLAP_AREA) {
        const verb = direct > MIN_OVERLAP_AREA ? 'overlaps' : 'covers or is covered by'
        warnings.push({ step, kind: 'overlap', message: `${a.id} ${verb} ${b.id} (${Math.round(area)}px²); fix it or mark an intentional overlap with data-presentation-allow-overlap` })
      }
    }
  }
  return warnings
}

const ACTIVE_FIELDS = ['color', 'backgroundColor', 'borderColor', 'borderWidth', 'opacity', 'width', 'height', 'fontWeight']

/** True when the active control differs from an inactive one in any compared style. */
export function activeIsDistinct(active, inactive) {
  return ACTIVE_FIELDS.some((field) => active[field] !== inactive[field])
}

/** `chrome`: `[{ name, active, inactive }]` style snapshots; `inactive` may be null. */
export function activeChromeWarnings(chrome, step) {
  return chrome
    .filter((c) => c.active && c.inactive && !activeIsDistinct(c.active, c.inactive))
    .map((c) => ({
      step,
      kind: 'active-chrome',
      message: `active ${c.name} looks identical to inactive ones; style [data-presentation-active="true"]`,
    }))
}

export function attributionWarnings(attribution, step) {
  const hook = 'data-presentation-attribution'
  if (!attribution) {
    return [{ step, kind: 'attribution', message: `attribution link is missing; the kit renders [${hook}]` }]
  }
  const warnings = []
  if (attribution.fontSizePx < MIN_ATTRIBUTION_FONT_PX) {
    warnings.push({ step, kind: 'attribution', message: `attribution text is ${attribution.fontSizePx}px, under ${MIN_ATTRIBUTION_FONT_PX}px; style [${hook}]` })
  }
  if (attribution.color === BROWSER_DEFAULT_LINK_COLOR && /underline/.test(attribution.textDecoration)) {
    warnings.push({ step, kind: 'attribution', message: `attribution still has the browser-default link look; style [${hook}]` })
  }
  return warnings
}

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/

/** Output directory for a slug; refuses anything that could leave `<root>/inspection`. */
export function inspectionDir(root, slug, narrow = false) {
  if (!SLUG.test(slug)) throw new Error(`invalid presentation slug "${slug}": use lowercase words joined by hyphens`)
  const base = path.resolve(root, 'inspection')
  const dir = path.resolve(base, slug + (narrow ? '-narrow' : ''))
  if (!dir.startsWith(base + path.sep)) throw new Error(`refusing to write outside ${base}`)
  // A symlinked inspection/ would make the recursive delete follow it out of the project.
  if (fs.existsSync(base) && fs.lstatSync(base).isSymbolicLink()) {
    throw new Error(`refusing to use ${base}: it is a symlink`)
  }
  return dir
}

export function stepFileName(index) {
  return `step-${String(index + 1).padStart(2, '0')}.png`
}

export function formatWarning(w) {
  return `WARN step ${String(w.step + 1).padStart(2, '0')} ${w.kind}: ${w.message}`
}

/** Warnings are advisory: only operational failures change the exit status. */
export function inspectExitCode({ failure }) {
  return failure ? 1 : 0
}
