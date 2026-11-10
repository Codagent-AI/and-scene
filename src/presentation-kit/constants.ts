export const DESIGN_W = 880
export const DESIGN_H = 380
export const MIN_SCALE = 0
export const EASE = [0.22, 1, 0.36, 1] as const
export const LAYOUT_T = { duration: 0.45, ease: EASE }
export const ENTER_DELAY = 0.45
export const ENTER_T = { duration: 0.25, delay: ENTER_DELAY }
export const STAGE_LAYOUT = {
  browse: { top: 100, bottom: 210, side: 24 },
  present: { top: 70, bottom: 100, side: 24 },
} as const
export function fitScale(width: number, height: number) {
  return Math.max(MIN_SCALE, Math.min(width / DESIGN_W, height / DESIGN_H))
}
