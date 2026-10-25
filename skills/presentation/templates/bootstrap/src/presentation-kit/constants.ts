export const DESIGN_W = 880
export const DESIGN_H = 380
export const MIN_SCALE = 0
export const EASE = [0.22, 1, 0.36, 1] as const
export const LAYOUT_T = 0.45
export const ENTER_T = 0.24
export const ENTER_DELAY = LAYOUT_T
export const SETTLE_MS = (LAYOUT_T + ENTER_T) * 1000 + 120
export const WIDE_VIEWPORT = 1100
export const STAGE_LAYOUT = {
  browse: { top: 112, bottom: 208, side: 24, toc: 184 },
  present: { top: 64, bottom: 104, side: 24, toc: 0 },
} as const
export const DEFAULT_ATTRIBUTION_URL = 'https://github.com/Codagent-AI/and-scene'
