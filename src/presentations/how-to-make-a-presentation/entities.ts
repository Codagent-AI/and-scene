/**
 * This presentation's layoutId namespace and fixed geometry (design-canvas px).
 * Every entity has one rectangle for its whole life, so entities accumulate
 * across steps and are never rearranged.
 */
export const GEOMETRY = {
  you: { x: 40, y: 24, w: 150, h: 60 },
  prompt: { x: 205, y: 94, w: 210, h: 30 },
  skill: { x: 690, y: 24, w: 150, h: 60 },
  'you-skill': { x: 190, y: 54, w: 500, h: 0 },
  question: { x: 380, y: 22, w: 120, h: 28 },
  control: { x: 40, y: 94, w: 150, h: 30 },
  tray: { x: 40, y: 150, w: 200, h: 24 },
  'card-1': { x: 40, y: 190, w: 100, h: 100 },
  'card-2': { x: 185, y: 190, w: 100, h: 100 },
  'card-3': { x: 330, y: 190, w: 100, h: 100 },
  'card-4': { x: 475, y: 190, w: 100, h: 100 },
  'link-1': { x: 140, y: 240, w: 45, h: 0 },
  'link-2': { x: 285, y: 240, w: 45, h: 0 },
  'link-3': { x: 430, y: 240, w: 45, h: 0 },
  'morph-1': { x: 150, y: 206, w: 24, h: 24 },
  'morph-2': { x: 295, y: 206, w: 24, h: 24 },
  'morph-3': { x: 440, y: 206, w: 24, h: 24 },
  ghost: { x: 620, y: 190, w: 100, h: 100 },
  socket: { x: 230, y: 306, w: 300, h: 44 },
  plug: { x: 380, y: 306, w: 0, h: -14 },
  verify: { x: 745, y: 190, w: 95, h: 100 },
  'verify-link': { x: 720, y: 240, w: 25, h: 0 },
  'verify-check': { x: 812, y: 196, w: 22, h: 22 },
  route: { x: 560, y: 306, w: 280, h: 44 },
  modify: { x: 800, y: 88, w: 0, h: 216 },
  flag: { x: 179, y: 184, w: 112, h: 112 },
  frame: { x: 6, y: 6, w: 868, h: 368 },
} as const

export type EntityId = keyof typeof GEOMETRY

/** Entities drawn over others on purpose; exempt from overlap checks. */
export const OVERLAYS: readonly EntityId[] = ['verify-check', 'flag', 'frame']

export interface SamplePayload {
  /** Entities on screen at this step, in draw order. */
  visible: readonly EntityId[]
}
