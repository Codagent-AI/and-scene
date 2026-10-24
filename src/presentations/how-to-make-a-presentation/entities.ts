import type { At } from '../../presentation-kit/index.ts'

/** This presentation's layoutId namespace: stable entity ids and canvas positions. */
export const ENT = {
  you: 'htmp-you',
  prompt: 'htmp-prompt',
  skill: 'htmp-skill',
  link: 'htmp-link',
  question: 'htmp-question',
  tray: 'htmp-tray',
  card1: 'htmp-card-1',
  card2: 'htmp-card-2',
  card3: 'htmp-card-3',
  morph1: 'htmp-morph-1',
  morph2: 'htmp-morph-2',
  morphLabel: 'htmp-morph-label',
  ghost: 'htmp-ghost',
  ghostLink: 'htmp-ghost-link',
  depth: 'htmp-depth',
  kit: 'htmp-kit',
  kitLink: 'htmp-kit-link',
  verify: 'htmp-verify',
  verifyLink: 'htmp-verify-link',
  pass: 'htmp-pass',
  modify: 'htmp-modify',
  edited: 'htmp-edited',
  reveal: 'htmp-reveal',
} as const

const CARD_Y = 165
const CARD_W = 136
const CARD_H = 100

export const AT: Record<string, At> = {
  you: { x: 30, y: 20, w: 140, h: 56 },
  prompt: { x: 30, y: 84, w: 140, h: 34 },
  skill: { x: 710, y: 20, w: 140, h: 56 },
  question: { x: 380, y: 10, w: 120, h: 28 },
  tray: { x: 30, y: 272, w: 820, h: 4 },
  card1: { x: 30, y: CARD_Y, w: CARD_W, h: CARD_H },
  card2: { x: 208, y: CARD_Y, w: CARD_W, h: CARD_H },
  card3: { x: 386, y: CARD_Y, w: CARD_W, h: CARD_H },
  ghost: { x: 564, y: CARD_Y, w: CARD_W, h: CARD_H },
  verify: { x: 742, y: CARD_Y, w: 108, h: CARD_H },
  pass: { x: 770, y: 232, w: 52, h: 24 },
  depth: { x: 30, y: 126, w: 140, h: 28 },
  morphLabel: { x: 168, y: 222, w: 38, h: 14 },
  kit: { x: 300, y: 304, w: 280, h: 40 },
  edited: { x: 232, y: 140, w: 88, h: 22 },
  reveal: { x: 4, y: 2, w: 872, h: 374 },
}

/** Vertical centre of the cards, where chain arrows run. */
export const CHAIN_Y = CARD_Y + CARD_H / 2
export const CARD_RIGHT = (card: At) => card.x + (card.w ?? 0)
