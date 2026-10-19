import { DESIGN_H, DESIGN_W, MIN_SCALE, STAGE_LAYOUT, TOC_MIN_WIDTH, type PresentationMode } from './constants'

export interface Viewport {
  width: number
  height: number
}

export function tocVisible(mode: PresentationMode, viewportWidth: number): boolean {
  return mode === 'browse' && viewportWidth >= TOC_MIN_WIDTH
}

/** Space left for the stage after header, footer and optional ToC. */
export function availableStageSize(mode: PresentationMode, viewport: Viewport) {
  const layout = STAGE_LAYOUT[mode]
  const toc = tocVisible(mode, viewport.width) ? layout.toc : 0
  return {
    width: viewport.width - layout.side * 2 - toc,
    height: viewport.height - layout.top - layout.bottom,
  }
}

/**
 * Uniform scale that fits the design canvas into the available size. Every
 * finite positive size gets its exact fit; MIN_SCALE only covers degenerate
 * (zero, negative or non-finite) measurements.
 */
export function computeFitScale(
  availableWidth: number,
  availableHeight: number,
  designWidth = DESIGN_W,
  designHeight = DESIGN_H,
): number {
  const usable = (n: number) => Number.isFinite(n) && n > 0
  if (!usable(availableWidth) || !usable(availableHeight)) return MIN_SCALE
  return Math.min(availableWidth / designWidth, availableHeight / designHeight)
}

export function stageScale(
  mode: PresentationMode,
  viewport: Viewport,
  designWidth = DESIGN_W,
  designHeight = DESIGN_H,
): number {
  const { width, height } = availableStageSize(mode, viewport)
  return computeFitScale(width, height, designWidth, designHeight)
}
