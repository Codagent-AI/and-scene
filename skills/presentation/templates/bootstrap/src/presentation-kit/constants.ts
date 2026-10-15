export const EASE = [0.22, 1, 0.36, 1] as const

export const LAYOUT_T = { duration: 0.6, ease: EASE }
export const ENTER_T = { duration: 0.35, ease: EASE }
/** Newcomers wait for persisting entities to finish their layout move. */
export const ENTER_DELAY = LAYOUT_T.duration

export const DESIGN_W = 880
export const DESIGN_H = 380
export const MIN_SCALE = 0.3

export type Mode = 'browse' | 'present'

/** Per-mode fit geometry: space (px) kept free around the canvas inside the stage area. */
export const STAGE_LAYOUT = {
  browse: { insetX: 24, insetY: 16 },
  present: { insetX: 8, insetY: 8 },
} as const

export const DEFAULT_ATTRIBUTION = {
  label: 'made by and-scene',
  href: 'https://github.com/Codagent-AI/and-scene',
} as const

/** Minimum viewport width (px) at which browse mode shows the table of contents. */
export const WIDE_VIEWPORT_MIN = 1000
