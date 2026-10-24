/** This presentation's `layoutId` namespace and the step (1-based) each entity first appears in. */
export const INTRO = {
  you: 1,
  prompt: 1,
  skill: 2,
  talk: 2,
  question: 2,
  tray: 3,
  'tray-label': 3,
  'card-1': 3,
  'link-1': 3,
  'link-label': 3,
  'card-2': 4,
  'card-3': 4,
  'card-4': 4,
  'link-2': 4,
  'link-3': 4,
  ghost: 5,
  control: 5,
  socket: 6,
  verify: 7,
  'verify-link': 7,
  check: 7,
  'modify-arc': 8,
  'modify-label': 8,
  'edited-ring': 8,
  'edited-flag': 8,
  'reveal-frame': 9,
  'reveal-label': 9,
} as const

export type EntityId = keyof typeof INTRO

export const ENTITY_IDS = Object.keys(INTRO) as EntityId[]

/**
 * Canvas geometry (880 × 380). Entities accumulate; none is moved after it appears.
 * Type is sized so scene text stays legible when the canvas is scaled to a phone width.
 */
export const GEOMETRY = {
  you: { x: 24, y: 30, w: 230, h: 56 },
  skill: { x: 706, y: 30, w: 150, h: 56 },
  prompt: { x: 274, y: 78, w: 176, h: 44 },
  question: { x: 394, y: 10, w: 172, h: 36 },
  /** Docked flush under the `you` node (same x span, touching its bottom edge). */
  control: { x: 24, y: 86, w: 230, h: 36 },
  tray: { x: 20, y: 138, w: 840, h: 192 },
  trayLabel: { x: 40, y: 144, w: 280, h: 32 },
  linkLabel: { x: 82, y: 294, w: 160, h: 32 },
  cardY: 182,
  cardW: 108,
  cardH: 108,
  socket: { x: 520, y: 330, w: 180, h: 36 },
  check: { x: 812, y: 166, w: 32, h: 32 },
  editedRing: { x: 306, y: 176, w: 120, h: 120 },
  editedFlag: { x: 306, y: 296, w: 132, h: 34 },
  modifyLabel: { x: 460, y: 90, w: 100, h: 30 },
  revealFrame: { x: 4, y: 2, w: 872, h: 374 },
  revealLabel: { x: 24, y: 342, w: 280, h: 30 },
} as const

export const CARD_SLOTS = 6
export const slotX = (slot: number) => 40 + slot * 136
