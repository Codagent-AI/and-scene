export const DESIGN_W = 880
export const DESIGN_H = 380
export const MIN_SCALE = 0.2

export const EASE = [0.22, 1, 0.36, 1] as const
export const LAYOUT_T = 0.6
export const ENTER_T = 0.4
export const ENTER_DELAY = 0.65
export const EXIT_T = 0.3

/** Viewport width at and above which browse mode shows the table of contents. */
export const TOC_MIN_WIDTH = 1024
/** Width reserved for the table of contents on wide browse viewports. */
export const TOC_WIDTH = 220
/** Swipe distance threshold in CSS pixels. */
export const SWIPE_MIN_DISTANCE = 50

export const DEFAULT_ATTRIBUTION_HREF = 'https://github.com/Codagent-AI/and-scene'
export const DEFAULT_ATTRIBUTION_LABEL = 'made by and-scene'

export type Mode = 'browse' | 'present'

/** Space reserved around the canvas by the header and footer, per mode. */
export const STAGE_LAYOUT: Record<Mode, { top: number; bottom: number; side: number }> = {
  browse: { top: 64, bottom: 200, side: 24 },
  present: { top: 48, bottom: 112, side: 24 },
}
