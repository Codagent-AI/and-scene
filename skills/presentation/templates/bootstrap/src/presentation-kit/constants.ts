export type Mode = 'browse' | 'present'

export interface Canvas {
  width: number
  height: number
}

export const DESIGN_W = 880
export const DESIGN_H = 380
export const DEFAULT_CANVAS: Canvas = { width: DESIGN_W, height: DESIGN_H }
export const MIN_SCALE = 0.25

export const EASE = [0.22, 1, 0.36, 1] as const
export const LAYOUT_T = 0.6
export const ENTER_T = 0.4
/** Newcomers wait for persisting entities to finish moving. */
export const ENTER_DELAY = LAYOUT_T * 0.8

/** Padding (px) kept free around the scaled canvas, per mode. */
export const STAGE_LAYOUT: Record<Mode, { padding: number }> = {
  browse: { padding: 16 },
  present: { padding: 32 },
}

/** Viewport width (px) at which the browse table of contents appears. */
export const WIDE_VIEWPORT = 900
/** Minimum horizontal travel (px) that counts as a swipe. */
export const SWIPE_THRESHOLD = 50

export const ATTRIBUTION = {
  label: 'made by and-scene',
  href: 'https://github.com/and-scene/and-scene',
}

/** Marks a subtree whose text/chrome overlap is intentional and readable (see the inspect script). */
export const ALLOW_OVERLAP = { 'data-presentation-allow-overlap': '' } as const
