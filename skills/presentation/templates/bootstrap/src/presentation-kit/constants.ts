import type { Transition } from 'motion/react'

export const DESIGN_W = 880
export const DESIGN_H = 380
export const MIN_SCALE = 0.3

export const EASE = [0.22, 1, 0.36, 1] as const
export const LAYOUT_T: Transition = { duration: 0.6, ease: EASE }
export const ENTER_T: Transition = { duration: 0.4, ease: EASE }
/** Newcomers wait for persisting entities to finish their layout morph. */
export const ENTER_DELAY = 0.6

/** Space (in px) reserved around the stage per mode; layout geometry, not styling. */
export const STAGE_LAYOUT = {
  browse: { top: 64, bottom: 200, side: 24 },
  present: { top: 56, bottom: 96, side: 24 },
} as const

export const ATTRIBUTION_HREF = 'https://github.com/Codagent-AI/and-scene'
export const ATTRIBUTION_LABEL = 'made by and-scene'
export const TOC_MIN_WIDTH = 1000
