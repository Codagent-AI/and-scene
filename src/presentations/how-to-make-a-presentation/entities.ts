/**
 * The sample's layoutId namespace and fixed layout. Every entity id is defined once here and
 * reused by every step; an entity keeps the same rectangle (or endpoints) in every step that
 * shows it, so nothing is ever moved, rearranged, or redrawn. Canvas is 880 x 380; the
 * leftmost ~90px stay free for the table of contents on wide viewports.
 */

export interface Rect {
  x: number
  y: number
  w: number
  h: number
}

export interface Segment {
  from: readonly [number, number]
  to: readonly [number, number]
}

/** Entities drawn as boxed nodes, labels, chips, or frames. */
export const RECTS = {
  you: { x: 108, y: 44, w: 100, h: 52 },
  prompt: { x: 222, y: 6, w: 120, h: 30 },
  skill: { x: 548, y: 44, w: 110, h: 52 },
  'question-chip': { x: 366, y: 38, w: 28, h: 28 },
  'question-label': { x: 300, y: 74, w: 160, h: 16 },
  depth: { x: 108, y: 98, w: 120, h: 28 },
  tray: { x: 100, y: 140, w: 772, h: 160 },
  'card-1': { x: 108, y: 166, w: 84, h: 122 },
  'card-2': { x: 240, y: 166, w: 84, h: 122 },
  'card-3': { x: 372, y: 166, w: 84, h: 122 },
  'card-4': { x: 504, y: 166, w: 84, h: 122 },
  'morph-chip': { x: 205, y: 215, w: 24, h: 24 },
  'morph-label': { x: 192, y: 244, w: 48, h: 14 },
  ghost: { x: 636, y: 166, w: 84, h: 122 },
  socket: { x: 380, y: 300, w: 140, h: 34 },
  'kit-label': { x: 320, y: 340, w: 260, h: 16 },
  verify: { x: 768, y: 166, w: 100, h: 122 },
  'verify-build': { x: 776, y: 220, w: 84, h: 22 },
  'verify-render': { x: 776, y: 246, w: 84, h: 22 },
  'verify-pass': { x: 838, y: 154, w: 28, h: 28 },
  'modify-label': { x: 452, y: 100, w: 64, h: 18 },
  flag: { x: 440, y: 156, w: 24, h: 24 },
  frame: { x: 92, y: 2, w: 784, h: 376 },
} as const satisfies Record<string, Rect>

/** Entities drawn as arrows between canvas points. */
export const SEGMENTS = {
  'convo-arrow': { from: [210, 70], to: [546, 70] },
  'link-1-2': { from: [194, 227], to: [238, 227] },
  'link-2-3': { from: [326, 227], to: [370, 227] },
  'link-3-4': { from: [458, 227], to: [502, 227] },
  'link-4-ghost': { from: [590, 227], to: [634, 227] },
  'link-ghost-verify': { from: [722, 227], to: [766, 227] },
  'modify-arc': { from: [590, 98], to: [420, 164] },
} as const satisfies Record<string, Segment>

export type RectId = keyof typeof RECTS
export type SegmentId = keyof typeof SEGMENTS
export type EntityId = RectId | SegmentId

/** Stacking order: later entries paint above earlier ones. */
export const ENTITY_ORDER: readonly EntityId[] = [
  'tray',
  'you',
  'prompt',
  'skill',
  'convo-arrow',
  'question-chip',
  'question-label',
  'card-1',
  'link-1-2',
  'morph-chip',
  'morph-label',
  'card-2',
  'card-3',
  'card-4',
  'link-2-3',
  'link-3-4',
  'ghost',
  'link-4-ghost',
  'depth',
  'socket',
  'kit-label',
  'verify',
  'link-ghost-verify',
  'verify-build',
  'verify-render',
  'verify-pass',
  'modify-arc',
  'modify-label',
  'flag',
  'frame',
]

/** Entities that first appear at each step (index = step position). */
export const INTRODUCED: readonly (readonly EntityId[])[] = [
  ['you', 'prompt'],
  ['skill', 'convo-arrow', 'question-chip', 'question-label'],
  ['tray', 'card-1', 'link-1-2', 'morph-chip', 'morph-label'],
  ['card-2', 'card-3', 'card-4', 'link-2-3', 'link-3-4'],
  ['ghost', 'link-4-ghost', 'depth'],
  ['socket', 'kit-label'],
  ['verify', 'link-ghost-verify', 'verify-build', 'verify-render', 'verify-pass'],
  ['modify-arc', 'modify-label', 'flag'],
  ['frame'],
]

/** Index of the step that introduces each entity. */
export const INTRODUCED_AT: Readonly<Record<EntityId, number>> = Object.fromEntries(
  INTRODUCED.flatMap((ids, step) => ids.map((id) => [id, step])),
) as Record<EntityId, number>

/** Everything on screen at a step: all entities introduced at or before it. */
export function presentAt(step: number): EntityId[] {
  return INTRODUCED.slice(0, step + 1).flat()
}
