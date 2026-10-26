/** Shared easing curve for layout and enter/exit transitions. */
export const EASE = [0.16, 1, 0.3, 1] as const

/** Duration (seconds) for persisting-entity layout morphs. */
export const LAYOUT_T = 0.5

/** Duration (seconds) for newcomer/departing entity enter and exit animations. */
export const ENTER_T = 0.35

/** Delay (seconds) before a newcomer enters, so persisting entities settle first. */
export const ENTER_DELAY = LAYOUT_T * 0.6

/** Fixed design canvas width, matching the reference presentation. */
export const DESIGN_W = 880

/** Fixed design canvas height, matching the reference presentation. */
export const DESIGN_H = 380

/** Smallest allowed fit scale, so the canvas never shrinks past legibility. */
export const MIN_SCALE = 0.35

/**
 * Per-mode fit geometry: vertical space reserved for chrome above/below the
 * stage, so `useFitScale` can compute the space actually available to the
 * fixed design canvas in each mode.
 */
export const STAGE_LAYOUT = {
  browse: {
    reservedTop: 96,
    reservedBottom: 132,
    sidePadding: 32,
  },
  present: {
    reservedTop: 56,
    reservedBottom: 56,
    sidePadding: 32,
  },
} as const
