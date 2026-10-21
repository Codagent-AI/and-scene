import type { Rect } from '../../presentation-kit'

/**
 * This presentation's layoutId namespace. An entity keeps one id (and, for an
 * accumulating scene, one rectangle) for the whole talk so it morphs in place.
 */
export const ID = {
  first: '__SLUG__-first',
  second: '__SLUG__-second',
} as const

export type EntityId = keyof typeof ID

/** Zero-based step index at which each entity first appears. */
export const INTRODUCED_AT: Record<EntityId, number> = {
  first: 0,
  second: 1,
}

export const AT: Record<EntityId, Rect> = {
  first: { x: 40, y: 40, w: 200, h: 80 },
  second: { x: 400, y: 40, w: 200, h: 80 },
}
