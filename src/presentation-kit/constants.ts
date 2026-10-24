// Behavior and layout geometry only. No visual defaults live in the kit.

export const DESIGN_W = 880
export const DESIGN_H = 380

export const MIN_SCALE = 0.3

export const EASE = [0.22, 1, 0.36, 1] as const
/** Seconds a persisting entity takes to morph to its new layout. */
export const LAYOUT_T = 0.6
/** Seconds a newcomer takes to fade in. */
export const ENTER_T = 0.35
/** Newcomers start only after persisting entities have finished moving. */
export const ENTER_DELAY = LAYOUT_T
export const EXIT_T = 0.25

/** Viewport width (px) from which browse mode shows the table of contents. */
export const WIDE_VIEWPORT = 1024
/** Minimum horizontal travel (px) for a swipe to navigate. */
export const SWIPE_MIN = 50

export type Mode = 'present' | 'browse'
export const DEFAULT_MODE: Mode = 'browse'

/**
 * Per-mode fit geometry: pixels reserved around the design canvas.
 * `tocWidth` is additionally reserved on the left when the table of contents shows.
 */
export const STAGE_LAYOUT = {
  browse: { top: 56, bottom: 220, side: 24, tocWidth: 220 },
  present: { top: 56, bottom: 88, side: 24, tocWidth: 0 },
} as const satisfies Record<Mode, { top: number; bottom: number; side: number; tocWidth: number }>

/** Space kept at the bottom-right for the attribution link. */
export const ATTRIBUTION_RESERVE = 32

export const DEFAULT_ATTRIBUTION = {
  label: 'made by and-scene',
  href: 'https://github.com/Codagent-AI/and-scene',
} as const
