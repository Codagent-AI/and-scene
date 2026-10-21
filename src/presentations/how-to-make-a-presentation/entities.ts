import type { Rect } from '../../presentation-kit'

/**
 * This presentation's layoutId namespace. Every entity keeps one id and one
 * authored rectangle for the whole talk: entities accumulate and are never
 * rearranged or redrawn.
 *
 * Intentional stacks: the tray encloses the step cards, and the flag ring sits
 * over `card2`; both are overlaps by design.
 */
export const ID = {
  you: 'htmp-you',
  prompt: 'htmp-prompt',
  skill: 'htmp-skill',
  ask: 'htmp-ask',
  question: 'htmp-question',
  tray: 'htmp-tray',
  route: 'htmp-route',
  card1: 'htmp-card1',
  card2: 'htmp-card2',
  card3: 'htmp-card3',
  link1: 'htmp-link1',
  link1Label: 'htmp-link1-label',
  link2: 'htmp-link2',
  link2Label: 'htmp-link2-label',
  ghost: 'htmp-ghost',
  link3: 'htmp-link3',
  depth: 'htmp-depth',
  socket: 'htmp-socket',
  plug: 'htmp-plug',
  verify: 'htmp-verify',
  link4: 'htmp-link4',
  pass: 'htmp-pass',
  modify: 'htmp-modify',
  modifyLabel: 'htmp-modify-label',
  flag: 'htmp-flag',
  edited: 'htmp-edited',
  frame: 'htmp-frame',
} as const

export type EntityId = keyof typeof ID

/** Zero-based step index at which each entity first appears. */
export const INTRODUCED_AT: Record<EntityId, number> = {
  you: 0, prompt: 0,
  skill: 1, ask: 1, question: 1,
  tray: 2, route: 2, card1: 2, link1: 2, link1Label: 2,
  card2: 3, card3: 3, link2: 3, link2Label: 3,
  ghost: 4, link3: 4, depth: 4,
  socket: 5, plug: 5,
  verify: 6, link4: 6, pass: 6,
  modify: 7, modifyLabel: 7, flag: 7, edited: 7,
  frame: 8,
}

const CARD = { y: 164, w: 120, h: 100 }

export const AT: Partial<Record<EntityId, Rect>> = {
  you: { x: 30, y: 58, w: 140, h: 56 },
  prompt: { x: 30, y: 10, w: 190, h: 36 },
  skill: { x: 710, y: 58, w: 140, h: 56 },
  question: { x: 380, y: 52, w: 120, h: 26 },
  tray: { x: 20, y: 150, w: 840, h: 126 },
  route: { x: 36, y: 150, w: 120, h: 14 },
  card1: { x: 30, ...CARD },
  card2: { x: 206, ...CARD },
  card3: { x: 382, ...CARD },
  ghost: { x: 558, ...CARD },
  verify: { x: 734, ...CARD },
  link1Label: { x: 150, y: 196, w: 56, h: 16 },
  link2Label: { x: 326, y: 196, w: 56, h: 16 },
  depth: { x: 30, y: 118, w: 140, h: 24 },
  socket: { x: 30, y: 272, w: 472, h: 36 },
  pass: { x: 744, y: 272, w: 100, h: 24 },
  modifyLabel: { x: 520, y: 112, w: 70, h: 18 },
  flag: { x: 202, y: 160, w: 128, h: 108 },
  edited: { x: 216, y: 148, w: 60, h: 14 },
  frame: { x: 6, y: 6, w: 868, h: 368 },
}
