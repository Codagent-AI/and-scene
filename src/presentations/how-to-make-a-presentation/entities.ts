import type { Rect } from '../../presentation-kit'

/** Stable entity ids — the `layoutId` namespace of this presentation. */
export const ENTITIES = [
  'you',
  'prompt',
  'skill',
  'link-you-skill',
  'question-chip',
  'tray',
  'step-card-1',
  'link-1-2',
  'step-card-2',
  'step-card-3',
  'link-2-3',
  'ghost-card',
  'depth-control',
  'scene-kit',
  'verify',
  'link-ghost-verify',
  'pass-check',
  'modify-arc',
  'modify-chip',
  'edited-flag',
  'reveal-frame',
] as const

export type EntityId = (typeof ENTITIES)[number]

/** Index of the first step (0-based) in which each entity is on screen. */
export const FIRST_STEP: Record<EntityId, number> = {
  you: 0,
  prompt: 0,
  skill: 1,
  'link-you-skill': 1,
  'question-chip': 1,
  tray: 2,
  'step-card-1': 2,
  'link-1-2': 2,
  'step-card-2': 3,
  'step-card-3': 3,
  'link-2-3': 3,
  'ghost-card': 4,
  'depth-control': 4,
  'scene-kit': 5,
  verify: 6,
  'link-ghost-verify': 6,
  'pass-check': 6,
  'modify-arc': 7,
  'modify-chip': 7,
  'edited-flag': 7,
  'reveal-frame': 8,
}

// Step-card row: five slots on one line, chained left to right. Type and boxes are
// sized for the narrow-viewport fit, where the whole canvas renders at ~0.42x.
const CARD_Y = 156
const CARD_W = 126
const CARD_H = 112
const SLOT_X = [82, 244, 406, 568, 730]

const card = (slot: number): Rect => ({ x: SLOT_X[slot], y: CARD_Y, w: CARD_W, h: CARD_H })

export const GEOMETRY = {
  you: { x: 40, y: 34, w: 150, h: 56 },
  prompt: { x: 40, y: 96, w: 150, h: 32 },
  skill: { x: 690, y: 34, w: 150, h: 56 },
  'question-chip': { x: 365, y: 26, w: 150, h: 28 },
  'depth-control': { x: 45, y: 6, w: 190, h: 28 },
  tray: { x: 70, y: 282, w: 780, h: 30 },
  'step-card-1': card(0),
  'step-card-2': card(1),
  'step-card-3': card(2),
  'ghost-card': card(3),
  verify: card(4),
  'pass-check': { x: 836, y: 142, w: 34, h: 34 },
  'scene-kit': { x: 330, y: 312, w: 220, h: 46 },
  'modify-chip': { x: 8, y: 286, w: 60, h: 28 },
  'edited-flag': { x: 250, y: 118, w: 104, h: 28 },
  'reveal-frame': { x: 2, y: 2, w: 876, h: 376 },
} satisfies Partial<Record<EntityId, Rect>>

type P = { x: number; y: number }
const mid = (a: number, b: number) => (a + b) / 2
const rowY = CARD_Y + CARD_H / 2

/** Endpoints of the arrows; chips ride on top of the card-to-card links. */
export const ARROWS = {
  'link-you-skill': { from: { x: 190, y: 62 }, to: { x: 690, y: 62 }, both: true },
  'link-1-2': { from: { x: 208, y: rowY }, to: { x: 244, y: rowY } },
  'link-2-3': { from: { x: 370, y: rowY }, to: { x: 406, y: rowY } },
  'link-ghost-verify': { from: { x: 694, y: rowY }, to: { x: 730, y: rowY } },
  'modify-arc': { from: { x: 22, y: 128 }, to: { x: 72, y: 284 } },
} satisfies Partial<Record<EntityId, { from: P; to: P; both?: boolean }>>

/** Where the "what morphs" glyph sits above each card-to-card link. */
export const MORPH_CHIPS = [
  { id: 'link-1-2', x: mid(208, 244) - 11, y: rowY - 34 },
  { id: 'link-2-3', x: mid(370, 406) - 11, y: rowY - 34 },
] as const
