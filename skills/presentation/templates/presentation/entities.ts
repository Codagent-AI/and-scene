// Stable entity ids for the __PRESENTATION_SLUG__ presentation. Every id keeps one rectangle in
// every step where it appears, so entities accumulate and are never rearranged.

export const PRESENTATION_SLUG = '__PRESENTATION_SLUG__'

// Shared-layout ids are namespaced by presentation so no two presentations collide.
export const LAYOUT_NAMESPACE = `presentation:${PRESENTATION_SLUG}`

// Canvas coordinates in CSS px on the 880 x 380 design canvas.
export const BOXES = {
  start: { x: 40, y: 150, w: 180, h: 80 },
  middle: { x: 350, y: 150, w: 180, h: 80 },
  end: { x: 660, y: 150, w: 180, h: 80 },
} as const

export type BoxId = keyof typeof BOXES

export const ARROWS = {
  first: { from: { x: 220, y: 190 }, to: { x: 350, y: 190 }, bidirectional: false },
  second: { from: { x: 530, y: 190 }, to: { x: 660, y: 190 }, bidirectional: false },
} as const

export type ArrowId = keyof typeof ARROWS
export type EntityId = BoxId | ArrowId

export function layoutIdFor(id: EntityId): string {
  return `${LAYOUT_NAMESPACE}:${id}`
}

export function rectStyle(id: BoxId): { left: number; top: number; width: number; height: number } {
  const { x, y, w, h } = BOXES[id]
  return { left: x, top: y, width: w, height: h }
}
