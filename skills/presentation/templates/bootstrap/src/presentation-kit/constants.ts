export const EASE = [0.22, 1, 0.36, 1] as const

/** Seconds a persisting entity takes to move to its new layout. */
export const LAYOUT_T = 0.5
/** Seconds a newcomer takes to fade in. */
export const ENTER_T = 0.35
/** Newcomers wait for persisting entities to finish moving. */
export const ENTER_DELAY = LAYOUT_T
export const EXIT_T = 0.25

export const DESIGN_W = 880
export const DESIGN_H = 380
export const MIN_SCALE = 0.2

/** Per-mode space (CSS px, each side) kept free around the canvas when fitting. */
export const STAGE_LAYOUT = {
  browse: { padX: 24, padY: 16 },
  present: { padX: 48, padY: 32 },
} as const

/** The table of contents renders only at or above this viewport width (CSS px). */
export const TOC_BREAKPOINT = 1024
/** Minimum horizontal travel (CSS px) for a touch gesture to count as a swipe. */
export const SWIPE_THRESHOLD = 40

export const DEFAULT_ATTRIBUTION = {
  label: 'made by and-scene',
  href: 'https://github.com/Codagent-AI/and-scene',
} as const
