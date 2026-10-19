/** Entity registry for the sample scene: one namespace, one fixed geometry per entity. */

export const NS = 'htmp'
export const entityId = (key: string): string => `${NS}/${key}`

export const CARD_W = 96
export const CARD_H = 100
export const CARD_Y = 152
const SLOT_X0 = 22
const SLOT_PITCH = 148
const slotX = (i: number): number => SLOT_X0 + i * SLOT_PITCH
/** Horizontal centre of the gap that follows slot `i`. */
const gapX = (i: number): number => slotX(i) + CARD_W
const GAP = SLOT_PITCH - CARD_W
const LINK_Y = CARD_Y + CARD_H / 2

export type BoxKey =
  | 'prompt'
  | 'you'
  | 'skill'
  | 'question'
  | 'tray'
  | 'tray-label'
  | 'card-1'
  | 'card-2'
  | 'card-3'
  | 'card-4'
  | 'link-label-1'
  | 'link-label-2'
  | 'link-label-3'
  | 'link-label-4'
  | 'link-label-5'
  | 'ghost'
  | 'depth-control'
  | 'scene-kit'
  | 'verify'
  | 'verify-check'
  | 'modify-label'
  | 'flag'
  | 'frame'

export type ArrowKey = 'ask-arrow' | 'link-1' | 'link-2' | 'link-3' | 'link-4' | 'link-5' | 'modify'
export type EntityKey = BoxKey | ArrowKey

export interface Rect {
  x: number
  y: number
  w: number
  h: number
}

const gapLabel = (i: number): Rect => ({ x: gapX(i), y: LINK_Y - 26, w: GAP, h: 20 })

export const BOXES: Record<BoxKey, Rect> = {
  prompt: { x: 16, y: 14, w: 140, h: 44 },
  you: { x: 176, y: 10, w: 120, h: 52 },
  skill: { x: 588, y: 10, w: 140, h: 52 },
  question: { x: 370, y: 8, w: 140, h: 28 },
  'depth-control': { x: 176, y: 66, w: 120, h: 28 },
  'tray-label': { x: 22, y: 124, w: 130, h: 22 },
  tray: { x: 16, y: 260, w: 848, h: 8 },
  'card-1': { x: slotX(0), y: CARD_Y, w: CARD_W, h: CARD_H },
  'card-2': { x: slotX(1), y: CARD_Y, w: CARD_W, h: CARD_H },
  'card-3': { x: slotX(2), y: CARD_Y, w: CARD_W, h: CARD_H },
  'card-4': { x: slotX(3), y: CARD_Y, w: CARD_W, h: CARD_H },
  ghost: { x: slotX(4), y: CARD_Y, w: CARD_W, h: CARD_H },
  verify: { x: slotX(5), y: CARD_Y, w: CARD_W, h: CARD_H },
  'verify-check': { x: slotX(5) + CARD_W - 18, y: CARD_Y - 12, w: 30, h: 30 },
  'link-label-1': gapLabel(0),
  'link-label-2': gapLabel(1),
  'link-label-3': gapLabel(2),
  'link-label-4': gapLabel(3),
  'link-label-5': gapLabel(4),
  'scene-kit': { x: 355, y: 268, w: 170, h: 44 },
  'modify-label': { x: 596, y: 86, w: 80, h: 22 },
  flag: { x: slotX(3) + CARD_W - 12, y: CARD_Y - 14, w: 28, h: 28 },
  frame: { x: 2, y: 2, w: 876, h: 374 },
}

export interface Line {
  from: [number, number]
  to: [number, number]
  both?: boolean
  dashed?: boolean
}

const link = (i: number): Line => ({ from: [gapX(i) + 3, LINK_Y], to: [gapX(i) + GAP - 3, LINK_Y] })

export const ARROWS: Record<ArrowKey, Line> = {
  'ask-arrow': { from: [300, 46], to: [584, 46], both: true },
  'link-1': link(0),
  'link-2': link(1),
  'link-3': link(2),
  'link-4': link(3),
  'link-5': link(4),
  modify: { from: [610, 64], to: [slotX(3) + CARD_W / 2, CARD_Y - 2], dashed: true },
}

export const ENTITY_KEYS = [...Object.keys(BOXES), ...Object.keys(ARROWS)] as EntityKey[]
