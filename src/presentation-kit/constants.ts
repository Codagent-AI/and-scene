/** Fixed design canvas every scene is composed in (CSS px before fit scaling). */
export const DESIGN_W = 880
export const DESIGN_H = 380

/** Smallest uniform scale the canvas may be fit to. */
export const MIN_SCALE = 0.25

export const EASE = [0.4, 0, 0.2, 1] as const

/** Layout (layoutId morph) transition shared by every entity. */
export const LAYOUT_T = { duration: 0.5, delay: 0, ease: EASE } as const

/** Newcomers fade in only after continuing entities finish their layout motion. */
export const ENTER_T = 0.4
export const ENTER_DELAY = LAYOUT_T.delay + LAYOUT_T.duration
export const EXIT_T = 0.25

export const ENTER_ANIMATE = {
  opacity: 1,
  transition: { duration: ENTER_T, delay: ENTER_DELAY, ease: EASE },
} as const
export const EXIT_ANIMATE = {
  opacity: 0,
  transition: { duration: EXIT_T, delay: 0, ease: EASE },
} as const

/** Viewport width (CSS px) at which the table of contents becomes available. */
export const WIDE_VIEWPORT_MIN = 1024

/** Minimum horizontal travel (px) for a touch gesture to count as a swipe. */
export const SWIPE_MIN = 50

/** Chrome placement geometry (layout only, not styling). */
export const CHROME = {
  headerH: 56,
  tocH: 48,
  attributionH: 28,
  footerH: { browse: 140, present: 44 },
  sideInset: 16,
} as const

export type Mode = 'browse' | 'present'

/** Space reserved around the stage for each mode; the canvas is fit to the remainder. */
export const STAGE_LAYOUT = {
  browse: {
    top: CHROME.headerH + CHROME.tocH,
    bottom: CHROME.footerH.browse + CHROME.attributionH,
    side: CHROME.sideInset,
  },
  present: {
    top: CHROME.headerH,
    bottom: CHROME.footerH.present + CHROME.attributionH,
    side: CHROME.sideInset,
  },
} as const

export const ATTRIBUTION = {
  label: 'made by and-scene',
  href: 'https://github.com/Codagent-AI/and-scene',
} as const
