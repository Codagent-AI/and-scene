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

/** Canvas geometry (880 × 380). Entities accumulate; none is moved after it appears. */
export const GEOMETRY = {
  you: { x: 30, y: 24, w: 150, h: 64 },
  skill: { x: 700, y: 24, w: 150, h: 64 },
  prompt: { x: 30, y: 124, w: 190, h: 40 },
  question: { x: 380, y: 16, w: 120, h: 26 },
  /** Docked flush under the `you` node (same x span, touching its bottom edge). */
  control: { x: 30, y: 88, w: 150, h: 28 },
  tray: { x: 20, y: 170, w: 840, h: 156 },
  trayLabel: { x: 40, y: 176, w: 300, h: 20 },
  linkLabel: { x: 110, y: 302, w: 120, h: 16 },
  cardY: 202,
  cardW: 100,
  cardH: 96,
  socket: { x: 300, y: 326, w: 280, h: 34 },
  check: { x: 826, y: 188, w: 28, h: 28 },
  editedRing: { x: 324, y: 196, w: 112, h: 108 },
  editedFlag: { x: 440, y: 176, w: 64, h: 20 },
  modifyLabel: { x: 560, y: 112, w: 64, h: 18 },
  revealFrame: { x: 4, y: 2, w: 872, h: 374 },
  revealLabel: { x: 330, y: 0, w: 220, h: 16 },
} as const

export const CARD_SLOTS = 6
export const slotX = (slot: number) => 50 + slot * 140
