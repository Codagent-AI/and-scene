import type { Point } from '../../presentation-kit'

/** This presentation's layoutId namespace: every entity keeps one id for the whole talk. */
export const ID = {
  you: 'you',
  prompt: 'prompt',
  skill: 'skill',
  convo: 'convo-arrow',
  question: 'question-chip',
  depth: 'depth-control',
  ghost: 'ghost-card',
  socket: 'scene-kit',
  socketLink: 'scene-kit-link',
  verify: 'verify',
  verifyLink: 'verify-link',
  build: 'build-chip',
  render: 'render-chip',
  modify: 'modify-arc',
  modifyLabel: 'modify-label',
  flag: 'edited-flag',
  flagRing: 'edited-ring',
  frame: 'reveal-frame',
  card: (i: number) => `step-card-${i}`,
  cardLink: (i: number) => `card-link-${i}`,
  cardLinkLabel: (i: number) => `card-link-label-${i}`,
} as const

export const CARD_COUNT = 4
export const CARD_W = 100
export const CARD_H = 100
export const CARD_Y = 180
export const cardX = (i: number) => 30 + i * 140

export const POS = {
  you: { x: 30, y: 24, w: 140, h: 60 },
  skill: { x: 710, y: 24, w: 140, h: 60 },
  prompt: { x: 30, y: 118, w: 90, h: 30 },
  question: { x: 370, y: 18, w: 140, h: 26 },
  depth: { x: 30, y: 80, w: 130, h: 26 },
  ghost: { x: 590, y: CARD_Y, w: CARD_W, h: CARD_H },
  verify: { x: 730, y: CARD_Y, w: 120, h: CARD_H },
  build: { x: 730, y: 150, w: 56, h: 22 },
  render: { x: 794, y: 150, w: 56, h: 22 },
  socket: { x: 230, y: 312, w: 280, h: 46 },
  modifyLabel: { x: 420, y: 104, w: 70, h: 22 },
  flag: { x: 306, y: 162, w: 48, h: 18 },
  frame: { x: 8, y: 16, w: 864, h: 356 },
} as const

export const CONVO: { from: Point; to: Point } = { from: { x: 170, y: 54 }, to: { x: 710, y: 54 } }
export const SOCKET_LINK: { from: Point; to: Point } = { from: { x: 360, y: 312 }, to: { x: 360, y: 282 } }
export const VERIFY_LINK: { from: Point; to: Point } = { from: { x: 690, y: 230 }, to: { x: 730, y: 230 } }
export const MODIFY_ARC: { from: Point; to: Point } = { from: { x: 440, y: 62 }, to: { x: 370, y: 176 } }
