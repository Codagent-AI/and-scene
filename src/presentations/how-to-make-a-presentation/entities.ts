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

// Step-card row: five slots on one line, chained left to right.
const CARD_Y = 170
const CARD_W = 110
const CARD_H = 116
const SLOT_X = [90, 240, 390, 540, 690]

const card = (slot: number): Rect => ({ x: SLOT_X[slot], y: CARD_Y, w: CARD_W, h: CARD_H })

export const GEOMETRY = {
  you: { x: 40, y: 26, w: 130, h: 50 },
  prompt: { x: 40, y: 82, w: 130, h: 28 },
  skill: { x: 710, y: 26, w: 130, h: 50 },
  'question-chip': { x: 380, y: 18, w: 120, h: 24 },
  'depth-control': { x: 50, y: 4, w: 110, h: 22 },
  tray: { x: 70, y: 296, w: 750, h: 28 },
  'step-card-1': card(0),
  'step-card-2': card(1),
  'step-card-3': card(2),
  'ghost-card': card(3),
  verify: card(4),
  'pass-check': { x: 772, y: 156, w: 34, h: 34 },
  'scene-kit': { x: 340, y: 324, w: 200, h: 40 },
  'modify-chip': { x: 4, y: 196, w: 70, h: 24 },
  'edited-flag': { x: 250, y: 142, w: 90, h: 24 },
  'reveal-frame': { x: 2, y: 2, w: 876, h: 376 },
} satisfies Partial<Record<EntityId, Rect>>

type P = { x: number; y: number }
const mid = (a: number, b: number) => (a + b) / 2
const rowY = CARD_Y + CARD_H / 2

/** Endpoints of the arrows; chips ride on top of the card-to-card links. */
export const ARROWS = {
  'link-you-skill': { from: { x: 170, y: 51 }, to: { x: 710, y: 51 }, both: true },
  'link-1-2': { from: { x: 200, y: rowY }, to: { x: 240, y: rowY } },
  'link-2-3': { from: { x: 350, y: rowY }, to: { x: 390, y: rowY } },
  'link-ghost-verify': { from: { x: 650, y: rowY }, to: { x: 690, y: rowY } },
  'modify-arc': { from: { x: 24, y: 112 }, to: { x: 68, y: 308 } },
} satisfies Partial<Record<EntityId, { from: P; to: P; both?: boolean }>>

/** Where the "what morphs" glyph sits above each card-to-card link. */
export const MORPH_CHIPS = [
  { id: 'link-1-2', x: mid(200, 240) - 11, y: rowY - 34 },
  { id: 'link-2-3', x: mid(350, 390) - 11, y: rowY - 34 },
] as const
