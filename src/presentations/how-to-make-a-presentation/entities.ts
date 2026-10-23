/**
 * Stable entity ids and the single layout table for the sample. Every entity
 * keeps the same rectangle (or arrow endpoints) in every step where it appears,
 * so entities accumulate and are never rearranged.
 */

export const PRESENTATION_SLUG = 'how-to-make-a-presentation'

/** Namespace for shared-layout ids, so this presentation never collides with others. */
export const LAYOUT_NAMESPACE = `presentation:${PRESENTATION_SLUG}`

export interface Rect {
  x: number
  y: number
  w: number
  h: number
}

export interface Point {
  x: number
  y: number
}

export const BOXES = {
  you: { x: 40, y: 56, w: 140, h: 56 },
  prompt: { x: 40, y: 14, w: 260, h: 30 },
  skill: { x: 700, y: 56, w: 140, h: 56 },
  question: { x: 360, y: 40, w: 180, h: 28 },
  card1: { x: 30, y: 150, w: 110, h: 120 },
  card2: { x: 164, y: 150, w: 110, h: 120 },
  card3: { x: 298, y: 150, w: 110, h: 120 },
  verify: { x: 432, y: 150, w: 110, h: 120 },
  ghost: { x: 566, y: 150, w: 110, h: 120 },
  partial: { x: 40, y: 118, w: 110, h: 24 },
  socket: { x: 300, y: 270, w: 260, h: 40 },
  tray: { x: 24, y: 144, w: 760, h: 132 },
  morphLabel: { x: 100, y: 276, w: 110, h: 18 },
  flag: { x: 164, y: 126, w: 110, h: 20 },
  modifyLabel: { x: 780, y: 200, w: 80, h: 22 },
  route: { x: 30, y: 338, w: 790, h: 34 },
  frame: { x: 4, y: 4, w: 872, h: 372 },
} satisfies Record<string, Rect>

export const ARROWS = {
  chat: { from: { x: 180, y: 84 }, to: { x: 700, y: 84 }, bidirectional: true },
  link12: { from: { x: 140, y: 210 }, to: { x: 164, y: 210 }, bidirectional: false },
  link23: { from: { x: 274, y: 210 }, to: { x: 298, y: 210 }, bidirectional: false },
  link3v: { from: { x: 408, y: 210 }, to: { x: 432, y: 210 }, bidirectional: false },
  modify: { from: { x: 770, y: 112 }, to: { x: 770, y: 336 }, bidirectional: false },
} satisfies Record<string, { from: Point; to: Point; bidirectional: boolean }>

export type BoxId = keyof typeof BOXES
export type ArrowId = keyof typeof ARROWS
export type EntityId = BoxId | ArrowId

/**
 * Boxes allowed to overlap other content: the enclosing self-reference frame, and the tray,
 * an unframed region the step cards sit in.
 */
export const OVERLAP_EXEMPT: ReadonlySet<BoxId> = new Set<BoxId>(['frame', 'tray'])

export function layoutIdFor(id: EntityId): string {
  return `${LAYOUT_NAMESPACE}:${id}`
}

export function rectStyle(id: BoxId): { left: number; top: number; width: number; height: number } {
  const { x, y, w, h } = BOXES[id]
  return { left: x, top: y, width: w, height: h }
}

/** Frame stacking is declared explicitly: it sits behind the content it encloses. */
export const FRAME_STACK_ORDER = 0
