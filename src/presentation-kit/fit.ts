import { DESIGN_H, DESIGN_W, MIN_SCALE, STAGE_LAYOUT, WIDE_VIEWPORT } from './constants.ts'
import type { Mode } from './constants.ts'

export interface Size {
  width: number
  height: number
}

const measurable = (n: number) => Number.isFinite(n) && n > 0

/** Uniform scale that fits the design canvas into the available area. */
export function computeFitScale(available: Size, design: Size = { width: DESIGN_W, height: DESIGN_H }): number {
  if (!measurable(available.width) || !measurable(available.height)) return MIN_SCALE
  return Math.min(available.width / design.width, available.height / design.height)
}

export const isWide = (viewportWidth: number) => viewportWidth >= WIDE_VIEWPORT

/** Space left for the stage in the given mode, from the mode's fit geometry. */
export function availableStageSize(mode: Mode, viewport: Size): Size {
  const g = STAGE_LAYOUT[mode]
  const toc = isWide(viewport.width) ? g.tocWidth : 0
  return { width: viewport.width - g.side * 2 - toc, height: viewport.height - g.top - g.bottom }
}
