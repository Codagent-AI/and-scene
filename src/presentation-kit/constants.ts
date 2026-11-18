export const DESIGN_W = 880
export const DESIGN_H = 380
export const MIN_SCALE = 0
export const EASE = [0.22, 1, 0.36, 1] as const
export const LAYOUT_T = { duration: 0.55, ease: EASE }
export const ENTER_DELAY = LAYOUT_T.duration
export const ENTER_T = { duration: 0.25, delay: ENTER_DELAY }
export const STAGE_LAYOUT = {
  browse: { top: 100, bottom: 180, left: 24, right: 24 },
  present: { top: 72, bottom: 100, left: 24, right: 24 },
} as const
export const ATTRIBUTION_URL = 'https://github.com/Codagent-AI/and-scene'
