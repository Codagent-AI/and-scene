/** Reference fixed design canvas (matches the harness this kit generalizes). */
export const DESIGN_W = 880
export const DESIGN_H = 380

/** Never scale the stage down past this, even on very small viewports. */
export const MIN_SCALE = 0.35

export const EASE = [0.16, 1, 0.3, 1] as const

/** Duration for persisting-entity layout morphs (position/size/label changes). */
export const LAYOUT_T = 0.5
/** Duration for a newcomer/departing entity's own fade/scale transition. */
export const ENTER_T = 0.35
/** Newcomers wait for persisting entities' layout morph to settle first. */
export const ENTER_DELAY = LAYOUT_T

export interface StageChromeGeometry {
  headerHeight: number
  footerHeight: number
  sidePadding: number
  topPadding: number
  bottomPadding: number
}

/** Per-mode reserved chrome geometry used to fit the fixed canvas. */
export const STAGE_LAYOUT: Record<'present' | 'browse', StageChromeGeometry> = {
  browse: {
    headerHeight: 72,
    footerHeight: 112,
    sidePadding: 24,
    topPadding: 16,
    bottomPadding: 16,
  },
  present: {
    headerHeight: 56,
    footerHeight: 40,
    sidePadding: 24,
    topPadding: 16,
    bottomPadding: 16,
  },
}

export const ATTRIBUTION_LABEL = 'made by and-scene'
export const ATTRIBUTION_HREF = 'https://github.com/and-scene/and-scene'
