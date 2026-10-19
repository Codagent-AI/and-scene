/**
 * Starter presentation — the layoutId namespace. One evolving scene: an entity keeps its
 * id (and so morphs in place) for as long as it stays on screen. `first` is
 * the 1-based step it appears in. To move or resize an entity, change its
 * coordinates here (or drive them from the step payload) and keep the id.
 */
export type Point = readonly [number, number]

interface Base {
  id: string
  /** 1-based step in which the entity first appears. */
  first: number
}

export type EntityDef = Base &
  (
    | { kind: 'node'; x: number; y: number; w: number; h: number; text: string }
    | { kind: 'chip'; x: number; y: number; w: number; h: number; text: string }
    | { kind: 'arrow'; from: Point; to: Point; bidirectional?: boolean }
    | { kind: 'frame'; x: number; y: number; w: number; h: number }
  )

/** Design canvas is 880 x 380; keep every entity inside it. */
export const ENTITIES: readonly EntityDef[] = [
  { id: 'idea', first: 1, kind: 'node', x: 80, y: 150, w: 180, h: 80, text: 'An idea' },
  { id: 'result', first: 2, kind: 'node', x: 620, y: 150, w: 180, h: 80, text: 'A result' },
  { id: 'flow', first: 2, kind: 'arrow', from: [262, 190], to: [618, 190] },
  { id: 'note', first: 2, kind: 'chip', x: 370, y: 130, w: 140, h: 26, text: 'what changes' },
]

/** Entities visible at a 1-based step; each step adds to the previous one. */
export function entitiesThrough(step: number): EntityDef[] {
  return ENTITIES.filter((entity) => entity.first <= step)
}
