export const DESIGN_W = 880
export const DESIGN_H = 380
export const MIN_SCALE = 0.1
export const LAYOUT_T = 0.45
export const ENTER_T = 0.24
export const ENTER_DELAY = LAYOUT_T
export const EASE = [0.22, 1, 0.36, 1] as const

export const STAGE_LAYOUT = {
  browse: { header: 116, footer: 148 },
  present: { header: 64, footer: 36 },
} as const

export function fitScale({ width, height }: { width: number; height: number }) {
  return Math.max(MIN_SCALE, Math.min(width / DESIGN_W, height / DESIGN_H))
}
