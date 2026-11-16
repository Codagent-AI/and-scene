export const DESIGN_W = 880
export const DESIGN_H = 380
export const EASE = [0.22, 1, 0.36, 1] as const
export const LAYOUT_T = 0.45
export const ENTER_DELAY = LAYOUT_T
export const ENTER_T = 0.25
export const MIN_SCALE = 0.01
export const STAGE_LAYOUT = {
  browse: { header: 96, footer: 220, toc: 160 },
  present: { header: 72, footer: 100, toc: 0 },
} as const
export const WIDE_VIEWPORT = 1100
// Geometry only: short viewports reserve less space for chrome, never reflow the scene.
export const SHORT_VIEWPORT = 500
export const COMPACT_STAGE_LAYOUT = {
  browse: { header: 64, footer: 132, toc: 160 },
  present: { header: 52, footer: 72, toc: 0 },
} as const
export const COMPACT_NARROW_STAGE_LAYOUT = {
  browse: { header: 56, footer: 168, toc: 0 },
  present: { header: 44, footer: 64, toc: 0 },
} as const
