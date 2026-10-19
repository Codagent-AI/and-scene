// This presentation's entity namespace. Every entity has one fixed position and
// first appears at `from` (1-based step number); it never moves or is redrawn.
export type Point = readonly [number, number]

interface Base {
  id: string
  from: number
}
export type Entity =
  | (Base & { kind: 'node'; role: string; x: number; y: number; w: number; h: number; text?: string })
  | (Base & { kind: 'card'; n: number; x: number; y: number; w: number; h: number })
  | (Base & { kind: 'chip'; role: string; x: number; y: number; w: number; h: number; text?: string; overlap?: boolean })
  | (Base & { kind: 'arrow'; role: string; a: Point; b: Point; via?: Point; both?: boolean })
  | (Base & { kind: 'frame'; x: number; y: number; w: number; h: number; text: string })

export const ns = (name: string) => `how-to:${name}`

const CARD_W = 100
const CARD_H = 110
const CARD_Y = 170
const slotX = (i: number) => 30 + 144 * i

const card = (i: number): Entity => ({ id: ns(`card-${i}`), from: i === 0 ? 3 : 4, kind: 'card', n: i + 1, x: slotX(i), y: CARD_Y, w: CARD_W, h: CARD_H })
const link = (i: number): Entity[] => [
  { id: ns(`link-${i}`), from: 4, kind: 'arrow', role: 'link', a: [slotX(i) + CARD_W + 4, 225], b: [slotX(i + 1) - 4, 225] },
  { id: ns(`morph-${i}`), from: 4, kind: 'chip', role: 'morph', x: slotX(i) + CARD_W + 2, y: 196, w: 40, h: 20, text: 'morph' },
]

export const ENTITIES: readonly Entity[] = [
  { id: ns('you'), from: 1, kind: 'node', role: 'you', x: 40, y: 20, w: 140, h: 60, text: 'you' },
  { id: ns('prompt'), from: 1, kind: 'node', role: 'prompt', x: 40, y: 96, w: 140, h: 34, text: 'a topic' },
  { id: ns('skill'), from: 2, kind: 'node', role: 'skill', x: 700, y: 20, w: 140, h: 60, text: 'skill' },
  { id: ns('converse'), from: 2, kind: 'arrow', role: 'converse', a: [190, 50], b: [690, 50], both: true },
  { id: ns('question'), from: 2, kind: 'chip', role: 'question', x: 360, y: 12, w: 160, h: 26, text: 'question?' },
  { id: ns('tray'), from: 3, kind: 'node', role: 'tray', x: 30, y: 146, w: 140, h: 18, text: 'step cards' },
  card(0),
  card(1), card(2), card(3),
  ...link(0), ...link(1), ...link(2),
  { id: ns('ghost'), from: 5, kind: 'node', role: 'ghost', x: slotX(4), y: CARD_Y, w: CARD_W, h: CARD_H, text: 'unspecified' },
  { id: ns('depth'), from: 5, kind: 'chip', role: 'depth', x: 90, y: 64, w: 110, h: 24, text: 'partial ↔ full', overlap: true },
  { id: ns('socket'), from: 6, kind: 'node', role: 'socket', x: 380, y: CARD_Y + CARD_H, w: 120, h: 36, text: 'scene kit' },
  { id: ns('verify'), from: 7, kind: 'node', role: 'verify', x: slotX(5), y: CARD_Y, w: CARD_W, h: CARD_H },
  { id: ns('verify-link'), from: 7, kind: 'arrow', role: 'link', a: [slotX(4) + CARD_W + 4, 225], b: [slotX(5) - 4, 225] },
  { id: ns('modify'), from: 8, kind: 'arrow', role: 'modify', a: [770, 86], b: [slotX(2) + 50, 166], via: [520, 150] },
  { id: ns('modify-chip'), from: 8, kind: 'chip', role: 'modify', x: 560, y: 90, w: 60, h: 22, text: 'modify' },
  { id: ns('flag'), from: 8, kind: 'chip', role: 'flag', x: slotX(2) + 84, y: CARD_Y - 10, w: 26, h: 24, overlap: true },
  { id: ns('frame'), from: 9, kind: 'frame', x: 6, y: 4, w: 868, h: 372, text: 'built with the skill' },
]

/** The card flagged by the modify beat. */
export const FLAGGED_CARD = ns('card-2')

export const entitiesAt = (stage: number): Entity[] => ENTITIES.filter((e) => e.from <= stage)
