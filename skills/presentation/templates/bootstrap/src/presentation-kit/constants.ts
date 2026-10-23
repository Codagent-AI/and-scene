/** Fixed design canvas every scene is composed in; it is scaled, never reflowed. */
export const DESIGN_W = 880
export const DESIGN_H = 380

/** Lower bound for the uniform fit scale so a tiny viewport still renders legibly. */
export const MIN_SCALE = 0.2
export const MAX_SCALE = 2

export const EASE = [0.22, 1, 0.36, 1] as const

/** Duration of a layout (layoutId) morph between two steps, in seconds. */
export const LAYOUT_T = 0.6
/** Duration of a newcomer's fade-in, in seconds. */
export const ENTER_T = 0.45
/** Newcomers start after persisting entities have finished morphing. */
export const ENTER_DELAY = 0.7

/** Table of contents shows only in browse mode at or above this viewport width. */
export const TOC_MIN_WIDTH = 1024

/** A horizontal swipe needs at least this much travel to count. */
export const SWIPE_MIN_PX = 50

export const ATTRIBUTION_HREF = 'https://github.com/Codagent-AI/and-scene'
export const ATTRIBUTION_TEXT = 'made by and-scene'

/**
 * Vertical space reserved for header and footer chrome, per mode. The fit uses this
 * fixed reservation rather than measuring the footer, so the scale never changes
 * with a step's caption length.
 */
export const CHROME_HEIGHT = {
  browse: 240,
  present: 110,
} as const

/** Padding kept free around the canvas when fitting it into the stage, per mode. */
export const STAGE_LAYOUT = {
  browse: { padX: 24, padY: 12 },
  present: { padX: 32, padY: 24 },
} as const
