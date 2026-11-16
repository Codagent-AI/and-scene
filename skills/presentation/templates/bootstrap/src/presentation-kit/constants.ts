export const DESIGN_W = 880
export const DESIGN_H = 380
export const MIN_SCALE = 0
export const EASE = [0.22, 1, 0.36, 1] as const
export const LAYOUT_T = { duration: 0.55, ease: EASE }
export const ENTER_DELAY = LAYOUT_T.duration
export const ENTER_T = { duration: 0.3, delay: ENTER_DELAY }
export const SETTLE_MS = 1000
export const STAGE_LAYOUT = {
  browse: { header: 90, footer: 196 },
  present: { header: 70, footer: 104 },
} as const
export const ATTRIBUTION_URL = 'https://github.com/Codagent-AI/and-scene'
