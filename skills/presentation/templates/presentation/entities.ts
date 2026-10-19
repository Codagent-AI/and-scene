/**
 * Layout for this scene. Each entity has a stable id (its layoutId). An entity may keep one
 * rectangle for the whole presentation or change position, size, label or emphasis between steps;
 * the kit morphs it in place either way. Canvas is the kit's default 880 x 380.
 */

export interface Rect {
  x: number
  y: number
  w: number
  h: number
}

export const RECTS = {
  idea: { x: 120, y: 140, w: 200, h: 80 },
  picture: { x: 560, y: 140, w: 200, h: 80 },
} as const satisfies Record<string, Rect>

export const SEGMENTS = {
  link: { from: [330, 180], to: [550, 180] },
} as const satisfies Record<string, { from: readonly [number, number]; to: readonly [number, number] }>

export type EntityId = keyof typeof RECTS | keyof typeof SEGMENTS

export const LABELS: Record<keyof typeof RECTS, string> = {
  idea: 'idea',
  picture: 'picture',
}

/** Entities that first appear at each step (index = step position). */
export const INTRODUCED: readonly (readonly EntityId[])[] = [['idea'], ['picture', 'link']]

/** Index of the step that introduces each entity. */
export function introducedAt(id: EntityId): number {
  return INTRODUCED.findIndex((ids) => ids.includes(id))
}

/** Everything on screen at a step: all entities introduced at or before it. */
export function presentAt(step: number): EntityId[] {
  return INTRODUCED.slice(0, step + 1).flat()
}
