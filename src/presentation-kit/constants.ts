import type { Mode } from './types.ts'

export const DESIGN_W = 880
export const DESIGN_H = 380
export const MIN_SCALE = 0.2

export const EASE = [0.22, 1, 0.36, 1] as const
export const LAYOUT_T = 0.6
export const LAYOUT_TRANSITION = { duration: LAYOUT_T, ease: EASE } as const
export const ENTER_T = 0.5
/** Newcomers wait at least as long as layout morphs so persisting entities settle first. */
export const ENTER_DELAY = LAYOUT_T
export const EXIT_T = 0.3

/** Time (ms) after which every transition has finished, plus a margin. */
export const SETTLE_MS = Math.ceil((ENTER_DELAY + ENTER_T) * 1000) + 300

/** Pixels reserved around the canvas inside the stage area, per mode. */
export const STAGE_LAYOUT: Record<Mode, { padX: number; padY: number }> = {
  browse: { padX: 24, padY: 12 },
  present: { padX: 16, padY: 8 },
}

export const WIDE_QUERY = '(min-width: 900px)'
export const SWIPE_MIN_PX = 40

export const DEFAULT_ATTRIBUTION = {
  label: 'made by and-scene',
  href: 'https://github.com/Codagent-AI/and-scene',
} as const
