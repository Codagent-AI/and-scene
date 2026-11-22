export const DESIGN_W = 880
export const DESIGN_H = 380
export const EASE = [0.22, 1, 0.36, 1] as const
export const LAYOUT_T = 0.5
export const ENTER_T = 0.25
export const ENTER_DELAY = LAYOUT_T
export const MIN_SCALE = 0
export const STAGE_LAYOUT = {
  browse: { header: 90, footer: 195, tocWidth: 180 },
  present: { header: 70, footer: 100, tocWidth: 0 },
} as const

export const ENTRY = {
  opacity: 1,
  transition: { delay: ENTER_DELAY, duration: ENTER_T, ease: EASE },
}
export const EXIT = { opacity: 0, transition: { duration: ENTER_T } }
