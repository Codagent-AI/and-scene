/**
 * The sample's entity namespace. Every entity has one fixed rectangle (or endpoints)
 * and the step at which it first appears; entities accumulate and are never moved,
 * resized or redrawn once on screen.
 */
export interface Rect {
  x: number
  y: number
  w: number
  h: number
}

const SLOT_X = (i: number) => 57 + 162 * i
const CARD_Y = 162
const CARD_W = 118
const CARD_H = 104
const slot = (i: number): Rect => ({ x: SLOT_X(i), y: CARD_Y, w: CARD_W, h: CARD_H })

/** Rendering order is stacking order. */
export const ENTITY_IDS = [
  'you',
  'prompt',
  'skill',
  'convoArrow',
  'questionChip',
  'tray',
  'card1',
  'card2',
  'card3',
  'link12',
  'chip12',
  'link23',
  'chip23',
  'ghost',
  'control',
  'socket',
  'linkVerify',
  'verify',
  'passChip',
  'modifyArc',
  'modifyChip',
  'flag',
  'frame',
  'frameLabel',
] as const

export type EntityId = (typeof ENTITY_IDS)[number]

/** First step (1-based) at which each entity is on screen. */
export const APPEARS_AT: Record<EntityId, number> = {
  you: 1,
  prompt: 1,
  skill: 2,
  convoArrow: 2,
  questionChip: 2,
  tray: 3,
  card1: 3,
  card2: 4,
  card3: 4,
  link12: 4,
  chip12: 4,
  link23: 4,
  chip23: 4,
  ghost: 5,
  control: 5,
  socket: 6,
  linkVerify: 7,
  verify: 7,
  passChip: 7,
  modifyArc: 8,
  modifyChip: 8,
  flag: 8,
  frame: 9,
  frameLabel: 9,
}

export const RECTS = {
  you: { x: 60, y: 30, w: 140, h: 64 },
  prompt: { x: 60, y: 102, w: 140, h: 28 },
  skill: { x: 680, y: 30, w: 140, h: 64 },
  questionChip: { x: 350, y: 30, w: 100, h: 24 },
  tray: { x: 40, y: 150, w: 800, h: 128 },
  card1: slot(0),
  card2: slot(1),
  card3: slot(2),
  ghost: slot(3),
  verify: slot(4),
  chip12: { x: 175, y: 194, w: 44, h: 18 },
  chip23: { x: 337, y: 194, w: 44, h: 18 },
  control: { x: 146, y: 8, w: 110, h: 24 },
  socket: { x: 340, y: 270, w: 200, h: 34 },
  passChip: { x: 789, y: 170, w: 28, h: 28 },
  modifyChip: { x: 490, y: 126, w: 52, h: 18 },
  flag: { x: 251, y: 254, w: 68, h: 16 },
  frame: { x: 8, y: 2, w: 864, h: 374 },
  frameLabel: { x: 300, y: 346, w: 280, h: 22 },
} as const satisfies Partial<Record<EntityId, Rect>>

type Pt = readonly [number, number]
export interface Link {
  from: Pt
  to: Pt
  bidirectional?: boolean
  bend?: number
}

export const LINKS = {
  convoArrow: { from: [204, 62], to: [676, 62], bidirectional: true },
  link12: { from: [175, 214], to: [219, 214] },
  link23: { from: [337, 214], to: [381, 214] },
  linkVerify: { from: [661, 214], to: [705, 214] },
  modifyArc: { from: [750, 94], to: [278, 162], bend: -30 },
} as const satisfies Partial<Record<EntityId, Link>>

export const entitiesAt = (step: number): EntityId[] => ENTITY_IDS.filter((id) => APPEARS_AT[id] <= step)

/** Entities that are new at `step` (not on screen at the step before it). */
export const newcomersAt = (step: number): EntityId[] => ENTITY_IDS.filter((id) => APPEARS_AT[id] === step)

export const SAMPLE_STEP_COUNT = 9
