/**
 * This presentation's entity namespace: every key is a stable `layoutId`, and the
 * geometry is in design-canvas coordinates (880 x 380).
 */
export const ENTITY = {
  you: 'you',
  prompt: 'prompt',
  skill: 'skill',
  dialog: 'you-skill-dialog',
  question: 'question-chip',
  tray: 'tray-label',
  card1: 'card-1',
  card2: 'card-2',
  card3: 'card-3',
  link12: 'link-1-2',
  link23: 'link-2-3',
  linkLabel12: 'link-label-1-2',
  linkLabel23: 'link-label-2-3',
  ghost: 'ghost-card',
  depth: 'depth-control',
  plug: 'kit-plug',
  socket: 'scene-kit',
  verify: 'verify',
  linkVerify: 'link-ghost-verify',
  pass: 'verify-pass',
  modify: 'modify-arc',
  modifyLabel: 'modify-label',
  edited: 'edited-flag',
  frame: 'reveal-frame',
  frameLabel: 'reveal-label',
} as const

export type EntityId = (typeof ENTITY)[keyof typeof ENTITY]

export interface Rect {
  left: number
  top: number
  width: number
  height: number
}

const CARD_W = 120
const CARD_H = 100
const CARD_TOP = 180

export const CARD_X = [30, 210, 390] as const
export const GHOST_X = 570
export const VERIFY_X = 750

export const RECT: Record<string, Rect> = {
  you: { left: 30, top: 8, width: 140, height: 54 },
  prompt: { left: 190, top: 72, width: 200, height: 36 },
  skill: { left: 710, top: 8, width: 140, height: 54 },
  question: { left: 370, top: 8, width: 140, height: 26 },
  tray: { left: 30, top: 150, width: 120, height: 22 },
  card1: { left: CARD_X[0], top: CARD_TOP, width: CARD_W, height: CARD_H },
  card2: { left: CARD_X[1], top: CARD_TOP, width: CARD_W, height: CARD_H },
  card3: { left: CARD_X[2], top: CARD_TOP, width: CARD_W, height: CARD_H },
  ghost: { left: GHOST_X, top: CARD_TOP, width: CARD_W, height: CARD_H },
  verify: { left: VERIFY_X, top: CARD_TOP, width: CARD_W, height: CARD_H },
  depth: { left: 30, top: 72, width: 140, height: 30 },
  socket: { left: 300, top: 306, width: 280, height: 40 },
  edited: { left: 296, top: 164, width: 48, height: 20 },
  pass: { left: 842, top: 166, width: 30, height: 30 },
  frame: { left: 4, top: 2, width: 872, height: 376 },
  frameLabel: { left: 290, top: 352, width: 300, height: 22 },
}

export const LINK_Y = CARD_TOP + CARD_H / 2
