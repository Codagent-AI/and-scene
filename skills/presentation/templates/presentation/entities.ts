import type { Rect } from '../../presentation-kit/index.ts'

/** Stable layoutId namespace for this presentation. */
export const ID = {
  topic: '__SLUG__-topic',
  detail: '__SLUG__-detail',
} as const

export interface Entity {
  id: string
  /** 1-based step at which the entity first appears; it stays from then on. */
  stage: number
  rect: Rect
  text: string
}

/** Entities only accumulate; design coordinates are within the 880 x 380 canvas. */
export const ENTITIES: readonly Entity[] = [
  { id: ID.topic, stage: 1, rect: { x: 60, y: 100, w: 300, h: 140 }, text: 'Topic' },
  { id: ID.detail, stage: 2, rect: { x: 520, y: 100, w: 300, h: 140 }, text: 'Detail' },
]
