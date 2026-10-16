import type { Mode } from './types.ts'

export const DESIGN_W = 880
export const DESIGN_H = 380

export const EASE = [0.22, 1, 0.36, 1] as const
/** Duration (s) of layout morphs for persisting entities. */
export const LAYOUT_T = 0.6
/** Duration (s) and delay (s) of newcomers; the delay lets persisting entities settle first. */
export const ENTER_T = 0.4
export const ENTER_DELAY = LAYOUT_T
export const EXIT_T = 0.25

export const MIN_SCALE = 0.2

/** Space (px) kept free around the canvas and the largest scale allowed, per mode. */
export const STAGE_LAYOUT: Record<Mode, { padX: number; padY: number; maxScale: number }> = {
  browse: { padX: 16, padY: 8, maxScale: 1.5 },
  present: { padX: 32, padY: 16, maxScale: 3 },
}

export const SWIPE_MIN_PX = 48
export const WIDE_QUERY = '(min-width: 900px)'
export const DEFAULT_ATTRIBUTION = {
  label: 'made by and-scene',
  href: 'https://github.com/Codagent-AI/and-scene',
}
