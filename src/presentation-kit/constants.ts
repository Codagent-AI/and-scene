export const DESIGN_W = 880
export const DESIGN_H = 380
export const MIN_SCALE = 0
export const EASE = [0.22, 1, 0.36, 1] as const
export const LAYOUT_T = 0.4
export const ENTER_T = 0.22
export const ENTER_DELAY = LAYOUT_T
export const EXIT_T = 0.18
export const TOC_MEDIA = '(min-width: 900px)'

export const STAGE_LAYOUT = {
  browse: { header: 76, footer: 128, attribution: 24, toc: '12rem' },
  present: { header: 56, footer: 64, attribution: 24, toc: '0px' },
} as const

export const ATTRIBUTION_URL = 'https://github.com/Codagent-AI/and-scene'
