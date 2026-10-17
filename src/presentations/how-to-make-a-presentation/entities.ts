/** This presentation's layoutId namespace and fixed canvas geometry (880 × 380 design units). */
const ns = (name: string) => `htm-${name}`

export const ID = {
  you: ns('you'),
  prompt: ns('prompt'),
  skill: ns('skill'),
  talk: ns('talk-arrow'),
  question: ns('question'),
  tray: ns('tray'),
  route: ns('route'),
  card: (n: number) => ns(`card-${n}`),
  link: (n: number) => ns(`link-${n}`),
  ghost: ns('ghost'),
  depth: ns('depth-control'),
  kit: ns('scene-kit'),
  verifyLink: ns('verify-link'),
  verify: ns('verify'),
  pass: ns('pass'),
  modify: ns('modify-arc'),
  modifyLabel: ns('modify-label'),
  edited: ns('edited-flag'),
  frame: ns('frame'),
  frameLabel: ns('frame-label'),
} as const

export interface Rect {
  left: number
  top: number
  width: number
  height: number
}

export const RECT = {
  you: { left: 30, top: 36, width: 130, height: 56 },
  prompt: { left: 30, top: 98, width: 130, height: 28 },
  skill: { left: 720, top: 36, width: 130, height: 56 },
  question: { left: 380, top: 30, width: 120, height: 26 },
  route: { left: 30, top: 132, width: 130, height: 20 },
  tray: { left: 14, top: 158, width: 852, height: 130 },
  depth: { left: 30, top: 6, width: 130, height: 24 },
  kit: { left: 150, top: 290, width: 300, height: 36 },
  verify: { left: 730, top: 172, width: 120, height: 102 },
  pass: { left: 826, top: 160, width: 28, height: 28 },
  modifyLabel: { left: 316, top: 98, width: 60, height: 20 },
  edited: { left: 206, top: 148, width: 76, height: 20 },
  frame: { left: 4, top: 2, width: 872, height: 374 },
  frameLabel: { left: 200, top: 336, width: 480, height: 28 },
} satisfies Record<string, Rect>

export const CARD_SLOTS = [30, 170, 310, 450] as const
export const CARD_SIZE = { width: 100, height: 100 }
export const CARD_TOP = 172
export const GHOST = { left: 590, top: CARD_TOP, ...CARD_SIZE }

export const ARROWS = {
  talk: { from: { x: 168, y: 64 }, to: { x: 712, y: 64 } },
  modify: { from: { x: 290, y: 72 }, to: { x: 244, y: 146 }, curve: { x: 300, y: 118 } },
} as const

/** Horizontal links between neighbouring cards (and ghost → verify), at card mid-height. */
export const linkBetween = (fromRight: number, toLeft: number) => ({
  from: { x: fromRight + 2, y: CARD_TOP + 50 },
  to: { x: toLeft - 2, y: CARD_TOP + 50 },
})
