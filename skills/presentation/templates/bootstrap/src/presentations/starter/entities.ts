import type { At } from '../../presentation-kit'

const ns = (name: string) => `starter:${name}`

/**
 * This presentation's layoutId namespace and canvas coordinates (880 x 380).
 * `since` is the 1-based step from which an entity stays on screen. Reuse an id
 * across steps so the entity morphs; give a new id only to a genuinely new thing.
 */
export const ENTITIES = {
  subject: { id: ns('subject'), since: 1, at: { x: 60, y: 120, w: 200, h: 90 } satisfies At },
  detail: { id: ns('detail'), since: 2, at: { x: 340, y: 120, w: 200, h: 90 } satisfies At },
  summary: { id: ns('summary'), since: 3, at: { x: 620, y: 120, w: 200, h: 90 } satisfies At },
} as const
