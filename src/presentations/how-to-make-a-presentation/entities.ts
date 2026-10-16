import type { Point, Rect } from '../../presentation-kit'

/** This presentation's layoutId namespace and canvas coordinates (880 × 380). */
export const ID = {
  you: 'htmp-you',
  prompt: 'htmp-prompt',
  skill: 'htmp-skill',
  talk: 'htmp-conversation',
  question: 'htmp-question',
  tray: 'htmp-tray',
  trayLabel: 'htmp-tray-label',
  ghost: 'htmp-ghost',
  depth: 'htmp-depth',
  kit: 'htmp-scene-kit',
  verify: 'htmp-verify',
  check: 'htmp-check',
  chain: 'htmp-chain',
  modify: 'htmp-modify',
  edited: 'htmp-edited',
  frame: 'htmp-frame',
  morph: 'htmp-morph',
} as const

export const cardId = (i: number) => `htmp-card-${i + 1}`
export const linkId = (i: number) => `htmp-link-${i + 1}`

export const CARD_COUNT = 4
const CARD_W = 100
const CARD_H = 110
const CARD_Y = 185
const CARD_PITCH = 130
const CARD_X0 = 50

export const AT = {
  you: { x: 60, y: 36, w: 150, h: 60 },
  prompt: { x: 60, y: 104, w: 150, h: 28 },
  skill: { x: 670, y: 36, w: 150, h: 60 },
  question: { x: 410, y: 28, w: 60, h: 26 },
  tray: { x: 30, y: 150, w: 820, h: 180 },
  trayLabel: { x: 540, y: 154, w: 296, h: 22 },
  depth: { x: 222, y: 104, w: 120, h: 28 },
  kit: { x: 330, y: 322, w: 220, h: 48 },
  verify: { x: 700, y: CARD_Y, w: 110, h: CARD_H },
  check: { x: 786, y: CARD_Y - 10, w: 30, h: 30 },
  frame: { x: 6, y: 4, w: 868, h: 372 },
  morph: { x: 118, y: 298, w: 100, h: 20 },
} satisfies Record<string, Rect>

export const cardAt = (i: number): Rect => ({
  x: CARD_X0 + i * CARD_PITCH,
  y: CARD_Y,
  w: CARD_W,
  h: CARD_H,
})
export const GHOST_AT = cardAt(CARD_COUNT)

export const POINTS = {
  convoFrom: { x: 214, y: 66 },
  convoTo: { x: 666, y: 66 },
  chainFrom: { x: GHOST_AT.x + CARD_W + 2, y: CARD_Y + CARD_H / 2 },
  chainTo: { x: AT.verify.x - 2, y: CARD_Y + CARD_H / 2 },
  modifyFrom: { x: 740, y: 100 },
  modifyTo: { x: cardAt(1).x + CARD_W - 4, y: CARD_Y - 10 },
} satisfies Record<string, Point>

export const linkPoints = (i: number): { from: Point; to: Point } => ({
  from: { x: cardAt(i).x + CARD_W + 2, y: CARD_Y + CARD_H / 2 },
  to: { x: cardAt(i + 1).x - 2, y: CARD_Y + CARD_H / 2 },
})
