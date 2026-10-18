import type { PresentationMode } from './types'

export const EASE = [0.22, 1, 0.36, 1] as const
/** Duration (s) of the layout morph applied to continuing entities. */
export const LAYOUT_T = 0.6
/** Duration (s) of a newcomer's enter animation. */
export const ENTER_T = 0.4
/** Newcomers wait until continuing entities have finished their layout morph. */
export const ENTER_DELAY = LAYOUT_T
export const EXIT_T = 0.3

export const DESIGN_W = 880
export const DESIGN_H = 380
export const MIN_SCALE = 0.2

/** Viewport width (px) from which the table of contents is shown in browse mode. */
export const WIDE_VIEWPORT = 1000
export const TOC_W = 200

/** Chrome geometry (px) the fixed canvas is fitted into, per mode. */
export const STAGE_LAYOUT: Record<PresentationMode, { header: number; footer: number; side: number }> = {
  browse: { header: 64, footer: 200, side: 32 },
  present: { header: 56, footer: 72, side: 16 },
}

export const DEFAULT_ATTRIBUTION = {
  label: 'made by and-scene',
  href: 'https://github.com/Codagent-AI/and-scene',
}

export const MOTION_LAYOUT = { duration: LAYOUT_T, ease: EASE }
