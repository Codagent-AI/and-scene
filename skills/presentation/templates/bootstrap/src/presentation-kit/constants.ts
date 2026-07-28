/** Fixed design canvas the diagram is composed in, then scaled uniformly to fit. */
export const DESIGN_W = 880
export const DESIGN_H = 380

/** Shared easing/timing for layout morphs and newcomer entrances. */
export const EASE = [0.16, 1, 0.3, 1] as const
export const LAYOUT_T = 0.5
export const ENTER_T = 0.4
export const ENTER_DELAY = 0.3

/** Never scale the canvas below this factor, even in very small viewports. */
export const MIN_SCALE = 0.4

/** Per-mode chrome gap the canvas must fit inside, above and below the stage. */
export const STAGE_LAYOUT = {
  browse: { topGap: 96, bottomGap: 120 },
  present: { topGap: 64, bottomGap: 64 },
} as const
