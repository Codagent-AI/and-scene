import type { Rect } from '../../presentation-kit'

/** Stable entity ids — this presentation's `layoutId` namespace. */
export const ENTITIES = ['subject', 'detail', 'link'] as const

export type EntityId = (typeof ENTITIES)[number]

/** Index of the first step (0-based) in which each entity is on screen. */
export const FIRST_STEP: Record<EntityId, number> = { subject: 0, detail: 1, link: 2 }

export const GEOMETRY: Record<'subject' | 'detail', Rect> = {
  subject: { x: 80, y: 120, w: 200, h: 100 },
  detail: { x: 560, y: 120, w: 200, h: 100 },
}

export const LINK = { from: { x: 280, y: 170 }, to: { x: 560, y: 170 } }
