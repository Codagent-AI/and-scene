import type { Mode } from './types'

export const DESIGN_W = 880
export const DESIGN_H = 380
export const MIN_SCALE = 0.25

/** Motion timing (seconds). */
export const EASE = [0.22, 1, 0.36, 1] as const
export const LAYOUT_T = 0.6
export const ENTER_T = 0.45
/** Newcomers wait until persisting entities have finished moving. */
export const ENTER_DELAY = LAYOUT_T
export const EXIT_T = 0.3
export const GROUP_FADE_T = 0.4

/** Default settle interval (ms) for screenshots: longest transition plus slack. */
export const SETTLE_MS = Math.ceil((ENTER_DELAY + ENTER_T) * 1000) + 250

/** Horizontal swipe threshold in px. */
export const SWIPE_MIN_PX = 40

/** Viewport width (px) from which browse mode shows the table of contents. */
export const WIDE_MIN_PX = 1024

/** Per-mode fit geometry used when the stage region cannot be measured. */
export interface StageLayout {
  insetX: number
  insetY: number
  headerH: number
  footerH: number
  tocW: number
  maxScale: number
}

export const STAGE_LAYOUT: Record<Mode, StageLayout> = {
  browse: { insetX: 16, insetY: 8, headerH: 56, footerH: 200, tocW: 220, maxScale: 1.6 },
  present: { insetX: 24, insetY: 16, headerH: 56, footerH: 96, tocW: 0, maxScale: 2.4 },
}

export const DEFAULT_ATTRIBUTION = {
  label: 'made by and-scene',
  href: 'https://github.com/Codagent-AI/and-scene',
}
