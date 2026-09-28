import type { PresentationMode } from './types'

/** Shared easing curve for layout and enter/exit motion. */
export const EASE = [0.22, 1, 0.36, 1] as const

/** Duration (seconds) for layout-projection morphs of persisting entities. */
export const LAYOUT_T = 0.5

/** Duration (seconds) for a newcomer entity's enter animation. */
export const ENTER_T = 0.35

/** Delay (seconds) before newcomers start entering, after layout settles. */
export const ENTER_DELAY = LAYOUT_T

/** Fixed design canvas width the diagram is authored against. */
export const DESIGN_W = 880

/** Fixed design canvas height the diagram is authored against. */
export const DESIGN_H = 380

/**
 * Advisory floor for the uniform fit scale. `useFitScale` does not clamp to
 * it, so a small viewport shows the whole composition rather than clipping
 * it; a host or presentation MAY use it to decide when to offer a
 * scroll/zoom affordance instead of shrinking further.
 */
export const MIN_SCALE = 0.35

interface StageLayout {
  /** Space reserved above the stage for chrome (px). */
  headerSpace: number
  /** Space reserved below the stage for chrome (px). */
  footerSpace: number
  /** Horizontal margin reserved on each side (px). */
  sideMargin: number
}

/**
 * Per-mode reference chrome geometry. `useFitScale` measures the stage
 * viewport's real box directly, so this is advisory sizing data for chrome
 * layout (e.g. presentation-owned CSS), not an input to the scale
 * computation itself.
 */
export const STAGE_LAYOUT: Record<PresentationMode, StageLayout> = {
  browse: { headerSpace: 96, footerSpace: 140, sideMargin: 32 },
  present: { headerSpace: 56, footerSpace: 56, sideMargin: 32 },
}
