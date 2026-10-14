import type { PresentationMode } from './types'

/** Shared easing curve for layout morphs and entrances. */
export const EASE = [0.22, 1, 0.36, 1] as const

/** Duration in seconds of a persisting entity's layout morph. */
export const LAYOUT_T = 0.6

/** Duration in seconds of a newcomer's fade-in. */
export const ENTER_T = 0.4

/** Newcomers start only once persisting entities have settled. */
export const ENTER_DELAY = LAYOUT_T

/** Default design canvas that every scene is composed in. */
export const DESIGN_W = 880
export const DESIGN_H = 380

/** Floor for the uniform fit scale so degenerate viewports stay usable. */
export const MIN_SCALE = 0.2

/** Viewports at or above this width show the browse table of contents. */
export const WIDE_VIEWPORT = 1024

export interface StageLayout {
  /** Height reserved for the header above the stage. */
  top: number
  /** Height reserved for the footer below the stage. */
  bottom: number
  /** Width of the side column reserved on wide viewports, when shown. */
  side: number
  /** Inset between the stage edges and the canvas fit box. */
  inset: number
}

/** Chrome geometry per mode. Layout only; carries no visual style. */
export const STAGE_LAYOUT: Record<PresentationMode, StageLayout> = {
  browse: { top: 96, bottom: 168, side: 200, inset: 24 },
  present: { top: 64, bottom: 96, side: 0, inset: 32 },
}

/** Public and-scene repository; the default attribution links here. */
export const ATTRIBUTION_URL = 'https://github.com/Codagent-AI/and-scene'
