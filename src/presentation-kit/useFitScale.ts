import { MIN_SCALE, STAGE_LAYOUT, WIDE_VIEWPORT } from './constants.ts'
import type { DesignSize, Mode } from './types.ts'
import { useViewport, type Viewport } from './useViewport.ts'

export function isWide(viewport: Viewport): boolean {
  return viewport.width >= WIDE_VIEWPORT
}

/** Region (px offsets from the viewport edges) the canvas is fitted into. */
export function stageRegion(mode: Mode, tocVisible: boolean) {
  const { top, bottom, side, toc } = STAGE_LAYOUT[mode]
  return { top, bottom, left: side + (tocVisible ? toc : 0), right: side }
}

/** One uniform factor that fits the design canvas into the stage region. */
export function fitScale(viewport: Viewport, mode: Mode, design: DesignSize, tocVisible: boolean): number {
  const region = stageRegion(mode, tocVisible)
  const availableWidth = viewport.width - region.left - region.right
  const availableHeight = viewport.height - region.top - region.bottom
  return Math.max(MIN_SCALE, Math.min(availableWidth / design.width, availableHeight / design.height))
}

export function useFitScale(mode: Mode, design: DesignSize, tocVisible: boolean): number {
  return fitScale(useViewport(), mode, design, tocVisible)
}
