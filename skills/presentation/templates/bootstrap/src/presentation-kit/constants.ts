/** Shared motion timing and fixed-canvas geometry. Layout behavior only, no visual style. */
export const EASE = [0.22, 1, 0.36, 1] as const
/** Seconds a persisting entity takes to move to its new layout. */
export const LAYOUT_T = 0.6
/** Seconds a newcomer takes to fade in. */
export const ENTER_T = 0.4
/** Newcomers wait for persisting entities to settle before entering. */
export const ENTER_DELAY = LAYOUT_T

export const DESIGN_W = 880
export const DESIGN_H = 380
export const MIN_SCALE = 0.2

/** Pixels reserved around the stage for the chrome of each mode. */
export interface StageGeometry {
  top: number
  bottom: number
  side: number
  /** Extra left inset used when the table of contents is shown. */
  tocInset: number
}

export const STAGE_LAYOUT = {
  browse: { top: 64, bottom: 168, side: 24, tocInset: 200 },
  present: { top: 56, bottom: 96, side: 24, tocInset: 0 },
} as const satisfies Record<string, StageGeometry>

/** Viewport width from which the table of contents is shown in browse mode. */
export const WIDE_VIEWPORT = 900
export const DEFAULT_ATTRIBUTION = {
  label: 'made by and-scene',
  href: 'https://github.com/and-scene/and-scene',
} as const
