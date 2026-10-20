/** This presentation's layoutId namespace: stable entity ids and where they sit on the 880 × 380 canvas. */
export const RECTS = {
  first: { x: 80, y: 140, w: 160, h: 80 },
  'first-moved': { x: 80, y: 40, w: 160, h: 80 },
  second: { x: 600, y: 140, w: 160, h: 80 },
} as const

export type Shape = 'first' | 'second'
