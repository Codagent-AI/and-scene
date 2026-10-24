/** This presentation's `layoutId` namespace: every entity id lives under `howto/`. */
const entity = (name: string) => `howto/${name}`

export const E = {
  you: entity('you'),
  prompt: entity('prompt'),
  skill: entity('skill'),
  convo: entity('conversation-arrow'),
  question: entity('question-chip'),
  control: entity('depth-control'),
  tray: entity('tray'),
  trayLabel: entity('tray-label'),
  card1: entity('card-1'),
  card2: entity('card-2'),
  card3: entity('card-3'),
  link1: entity('link-1'),
  link2: entity('link-2'),
  link3: entity('link-3'),
  morph1: entity('morph-1'),
  morph2: entity('morph-2'),
  ghost: entity('ghost-card'),
  socket: entity('scene-kit-socket'),
  plug: entity('scene-kit-plug'),
  verify: entity('verify'),
  verifyLink: entity('verify-link'),
  check: entity('verify-check'),
  modify: entity('modify-arc'),
  flag: entity('edited-flag'),
  ring: entity('edited-ring'),
  frame: entity('reveal-frame'),
  frameLabel: entity('reveal-label'),
} as const

export type EntityName = keyof typeof E

/** The step (1-based) at which each entity first appears; entities then persist. */
export const INTRODUCED_AT: Record<EntityName, number> = {
  you: 1, prompt: 1,
  skill: 2, convo: 2, question: 2,
  tray: 3, trayLabel: 3, card1: 3, link1: 3, morph1: 3,
  card2: 4, card3: 4, link2: 4, morph2: 4,
  ghost: 5, link3: 5, control: 5,
  socket: 6, plug: 6,
  verify: 7, verifyLink: 7, check: 7,
  modify: 8, flag: 8, ring: 8,
  frame: 9, frameLabel: 9,
}
