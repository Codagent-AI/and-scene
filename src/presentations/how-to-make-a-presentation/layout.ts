import type { Rect } from '../../presentation-kit/nodes/common.ts'

/** Canvas coordinates (880 × 380). Entities keep their rect for every step they appear in. */
export const R = {
  you: { x: 24, y: 16, w: 120, h: 56 },
  skill: { x: 736, y: 16, w: 120, h: 56 },
  prompt: { x: 24, y: 84, w: 132, h: 38 },
  depth: { x: 164, y: 84, w: 132, h: 38 },
  question: { x: 380, y: 8, w: 120, h: 26 },
  tray: { x: 24, y: 134, w: 90, h: 18 },
  ghost: { x: 522, y: 160, w: 130, h: 110 },
  socket: { x: 250, y: 262, w: 236, h: 56 },
  verify: { x: 700, y: 160, w: 156, h: 110 },
  flag: { x: 190, y: 276, w: 56, h: 22 },
  modifyLabel: { x: 520, y: 128, w: 110, h: 22 },
  reveal: { x: 6, y: 4, w: 868, h: 372 },
  revealLabel: { x: 270, y: 340, w: 340, h: 24 },
} satisfies Record<string, Rect>

export const CARD_X = [24, 190, 356]
export const CARD_Y = 160
export const CARD_W = 130
export const CARD_H = 110

export const card = (n: number): Rect => ({ x: CARD_X[n - 1], y: CARD_Y, w: CARD_W, h: CARD_H })
export const part = (n: number, row: number): Rect => ({ x: CARD_X[n - 1] + 10, y: CARD_Y + 12 + row * 30, w: CARD_W - 20, h: 22 })
