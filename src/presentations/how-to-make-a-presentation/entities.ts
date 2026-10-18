import type { At } from '../../presentation-kit'

/** Step (1-based) from which an entity is on screen; it stays on screen afterwards. */
export interface EntitySpec {
  id: string
  since: number
  at: At
}

const ns = (name: string) => `htmp:${name}`

/** The sample's layoutId namespace and fixed canvas coordinates (880 × 380). */
export const ENTITIES = {
  you: { id: ns('you'), since: 1, at: { x: 20, y: 24, w: 120, h: 52 } },
  prompt: { id: ns('prompt'), since: 1, at: { x: 150, y: 16, w: 110, h: 28 } },
  skill: { id: ns('skill'), since: 2, at: { x: 740, y: 24, w: 120, h: 52 } },
  question: { id: ns('question'), since: 2, at: { x: 420, y: 20, w: 40, h: 24 } },
  tray: { id: ns('tray'), since: 3, at: { x: 20, y: 140, w: 100, h: 24 } },
  card1: { id: ns('card-1'), since: 3, at: { x: 20, y: 170, w: 130, h: 110 } },
  card2: { id: ns('card-2'), since: 4, at: { x: 180, y: 170, w: 130, h: 110 } },
  card3: { id: ns('card-3'), since: 4, at: { x: 340, y: 170, w: 130, h: 110 } },
  morph1: { id: ns('morph-1'), since: 4, at: { x: 153, y: 213, w: 24, h: 24 } },
  morph2: { id: ns('morph-2'), since: 4, at: { x: 313, y: 213, w: 24, h: 24 } },
  ghost: { id: ns('ghost'), since: 5, at: { x: 500, y: 170, w: 130, h: 110 } },
  depth: { id: ns('depth'), since: 5, at: { x: 20, y: 84, w: 120, h: 26 } },
  kit: { id: ns('scene-kit'), since: 6, at: { x: 20, y: 282, w: 450, h: 40 } },
  verify: { id: ns('verify'), since: 7, at: { x: 660, y: 170, w: 130, h: 110 } },
  pass: { id: ns('pass'), since: 7, at: { x: 762, y: 176, w: 24, h: 24 } },
  route: { id: ns('route'), since: 8, at: { x: 500, y: 290, w: 290, h: 30 } },
  edited: { id: ns('edited'), since: 8, at: { x: 250, y: 140, w: 60, h: 24 } },
  reveal: { id: ns('reveal'), since: 9, at: { x: 2, y: 2, w: 876, h: 376 } },
  revealLabel: { id: ns('reveal-label'), since: 9, at: { x: 560, y: 342, w: 300, h: 24 } },
} as const satisfies Record<string, EntitySpec>

/** Connector geometry: arrows are drawn between literal canvas points. */
export const ARROWS = {
  talk: { id: ns('talk'), since: 2, from: [140, 50], to: [740, 50] },
  link1: { id: ns('link-1'), since: 4, from: [150, 225], to: [180, 225] },
  link2: { id: ns('link-2'), since: 4, from: [310, 225], to: [340, 225] },
  chain: { id: ns('chain'), since: 7, from: [630, 225], to: [660, 225] },
  modify: { id: ns('modify'), since: 8, from: [800, 76], to: [700, 290], bend: [880, 230] },
} as const

export const SAMPLE_STEP_COUNT = 9
