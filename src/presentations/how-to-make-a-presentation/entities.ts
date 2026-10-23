import type { Rect } from '../../presentation-kit'

/** This presentation's layoutId namespace: stable entity ids across all steps. */
export const E = {
  you: 'htm-you',
  prompt: 'htm-prompt',
  skill: 'htm-skill',
  talk: 'htm-talk',
  question: 'htm-question',
  trayLabel: 'htm-tray-label',
  card: (n: number) => `htm-card-${n}`,
  cardParts: (n: number, part: string) => `htm-card-${n}-${part}`,
  link: (n: number) => `htm-link-${n}`,
  linkLabel: 'htm-link-label',
  ghost: 'htm-ghost',
  depth: 'htm-depth',
  kit: 'htm-kit',
  kitPlug: 'htm-kit-plug',
  chain: 'htm-chain',
  verify: 'htm-verify',
  pass: 'htm-pass',
  route: 'htm-route',
  modify: 'htm-modify',
  edited: 'htm-edited',
  flag: 'htm-flag',
  frame: 'htm-frame',
  frameLabel: 'htm-frame-label',
} as const

/** Canvas coordinates (880 x 380). Entities never move once placed. */
export const AT = {
  you: { x: 40, y: 64, w: 140, h: 52 },
  prompt: { x: 40, y: 18, w: 140, h: 30 },
  skill: { x: 700, y: 64, w: 140, h: 52 },
  question: { x: 370, y: 48, w: 140, h: 26 },
  depth: { x: 40, y: 120, w: 140, h: 24 },
  trayLabel: { x: 40, y: 150, w: 140, h: 22 },
  card: (n: number): Rect => ({ x: 40 + (n - 1) * 155, y: 176, w: 130, h: 104 }),
  linkLabel: { x: 200, y: 154, w: 100, h: 20 },
  verify: { x: 700, y: 196, w: 140, h: 60 },
  pass: { x: 760, y: 262, w: 80, h: 26 },
  kit: { x: 200, y: 318, w: 440, h: 44 },
  route: { x: 700, y: 318, w: 140, h: 44 },
  flag: { x: 195, y: 286, w: 100, h: 22 },
  frame: { x: 6, y: 4, w: 868, h: 372 },
  frameLabel: { x: 360, y: -4, w: 160, h: 18 },
} as const

export const CARD_Y_MID = 228
