/** Easing used for every kit-driven transition. */
export const EASE = [0.22, 1, 0.36, 1] as const

/** Duration (s) of layout morphs for persisting entities. */
export const LAYOUT_T = 0.6

/** Duration (s) of newcomer enter animations and the delay that lets persisting entities settle first. */
export const ENTER_T = 0.35
export const ENTER_DELAY = LAYOUT_T * 0.7

/** Default fixed design canvas. */
export const DESIGN_W = 880
export const DESIGN_H = 380

/** Lower bound for the fit scale so the canvas never collapses. */
export const MIN_SCALE = 0.2

/**
 * Per-mode fit geometry. The stage region sits between header and footer;
 * `padX`/`padY` reserve breathing room (px) around the canvas inside it and
 * `maxScale` caps upscaling.
 */
export interface StageGeometry {
  padX: number
  padY: number
  maxScale: number
}

export const STAGE_LAYOUT: { browse: StageGeometry; present: StageGeometry } = {
  browse: { padX: 24, padY: 16, maxScale: 1.6 },
  present: { padX: 48, padY: 24, maxScale: 2.4 },
}

export type PresentationMode = 'present' | 'browse'

export const ATTRIBUTION_LABEL = 'made by and-scene'
export const ATTRIBUTION_HREF = 'https://github.com/Codagent-AI/and-scene'
