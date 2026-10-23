// layoutId namespace for this presentation: every id is prefixed so it cannot
// collide with another presentation's entities.
const ns = (name: string) => `how-to/${name}`

export const CARD_COUNT = 4
export const CARDS = Array.from({ length: CARD_COUNT }, (_, i) => i)

export const E = {
  you: ns('you'),
  prompt: ns('prompt'),
  skill: ns('skill'),
  talk: ns('talk-arrow'),
  question: ns('question'),
  tray: ns('tray-label'),
  card: (i: number) => ns(`card-${i + 1}`),
  cardTitle: (i: number) => ns(`card-${i + 1}-title`),
  cardCaption: (i: number) => ns(`card-${i + 1}-caption`),
  cardVisual: (i: number) => ns(`card-${i + 1}-visual`),
  link: (i: number) => ns(`link-${i + 1}`),
  morphs: ns('morphs-label'),
  ghost: ns('ghost-card'),
  depth: ns('depth-control'),
  kit: ns('scene-kit'),
  kitPlug: ns('scene-kit-plug'),
  verify: ns('verify'),
  verifyLink: ns('verify-link'),
  pass: ns('verify-pass'),
  route: ns('route'),
  modify: ns('modify-arc'),
  flag: ns('edited-flag'),
  frame: ns('reveal-frame'),
  frameLabel: ns('reveal-label'),
} as const

/** Slot geometry of the card tray, in design-canvas px. */
export const TRAY = { x0: 64, y: 165, cardW: 112, cardH: 110, pitch: 136 }
export const slotX = (slot: number) => TRAY.x0 + slot * TRAY.pitch
