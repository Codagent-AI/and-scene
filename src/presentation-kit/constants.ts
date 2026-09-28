import type { Mode } from './types'

/** Fixed design canvas the diagram is composed in, scaled to fit at runtime. */
export const DESIGN_W = 880
export const DESIGN_H = 380

/** Never scale the canvas below this, even on very small viewports. */
export const MIN_SCALE = 0.4

export const EASE = [0.22, 1, 0.36, 1] as const

/** Duration for layout-projection morphs of persisting entities. */
export const LAYOUT_T = 0.5

/** Duration for a newcomer entity's enter animation. */
export const ENTER_T = 0.4

/** Newcomers wait for persisting entities to settle before entering. */
export const ENTER_DELAY = LAYOUT_T

/** Swipe distance (px) that counts as a navigation gesture. */
export const SWIPE_THRESHOLD = 40

/** Minimum viewport width (px) at which the table of contents is shown. */
export const TOC_MIN_WIDTH = 960

/**
 * Per-mode chrome bands around the stage. The header sits in the top band,
 * the footer in the bottom band, and the stage fills the gap between them;
 * when the table of contents is shown, `tocGutter` is reserved on each side
 * so the centered canvas never covers it. Fixed per mode so the fit scale
 * stays constant while navigating and layout morphs stay clean.
 */
export const STAGE_LAYOUT: Record<Mode, { chromeTop: number; chromeBottom: number; tocGutter: number }> = {
  browse: { chromeTop: 96, chromeBottom: 132, tocGutter: 160 },
  present: { chromeTop: 64, chromeBottom: 48, tocGutter: 0 },
}
