export const DESIGN_W = 880
export const DESIGN_H = 380

export const EASE = [0.22, 1, 0.36, 1] as const
/** Duration of layout morphs for persisting entities (seconds). */
export const LAYOUT_T = 0.6
/** Duration of newcomer fade-in (seconds). */
export const ENTER_T = 0.4
/** Newcomers wait for persisting entities to finish their layout morph. */
export const ENTER_DELAY = LAYOUT_T
export const EXIT_T = 0.25

export const MIN_SCALE = 0.3
/** Viewport width (px) at which the browse-mode table of contents appears. */
export const TOC_MIN_WIDTH = 960
export const SWIPE_MIN_DISTANCE = 50

export type PresentationMode = 'browse' | 'present'

/** Fit geometry per mode: padding kept around the canvas and the scale ceiling. */
export const STAGE_LAYOUT: Record<
  PresentationMode,
  { padX: number; padY: number; maxScale: number }
> = {
  browse: { padX: 24, padY: 16, maxScale: 1.5 },
  present: { padX: 16, padY: 8, maxScale: 2 },
}

export const ATTRIBUTION_LABEL = 'made by and-scene'
export const ATTRIBUTION_HREF = 'https://github.com/Codagent-AI/and-scene'
