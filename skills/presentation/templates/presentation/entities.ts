/** This presentation's layoutId namespace and fixed canvas geometry (880 x 380). */
export interface Geometry {
  x: number
  y: number
  w: number
  h: number
}

export const ID = {
  subject: '__SLUG__/subject',
  detail: '__SLUG__/detail',
} as const

export const AT: Record<keyof typeof ID, Geometry> = {
  subject: { x: 100, y: 100, w: 240, h: 100 },
  detail: { x: 440, y: 100, w: 240, h: 100 },
}

/** First step (1-based) in which each entity is on screen. */
export const FIRST_STEP: Record<keyof typeof ID, number> = {
  subject: 1,
  detail: 2,
}
