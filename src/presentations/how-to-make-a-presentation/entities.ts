// This presentation's layoutId namespace: every entity keeps one id and one
// set of coordinates for the whole talk, so nothing is rearranged or redrawn.
export const E = {
  you: 'htm-you',
  prompt: 'htm-prompt',
  skill: 'htm-skill',
  talk: 'htm-talk',
  question: 'htm-question',
  tray: 'htm-tray',
  card1: 'htm-card-1',
  card2: 'htm-card-2',
  card3: 'htm-card-3',
  card4: 'htm-card-4',
  link1: 'htm-link-1',
  link1Label: 'htm-link-1-label',
  link2: 'htm-link-2',
  link2Label: 'htm-link-2-label',
  link3: 'htm-link-3',
  link3Label: 'htm-link-3-label',
  ghost: 'htm-ghost',
  control: 'htm-control',
  socket: 'htm-socket',
  verify: 'htm-verify',
  pass: 'htm-pass',
  modify: 'htm-modify',
  modifyLabel: 'htm-modify-label',
  edited: 'htm-edited',
  editedFlag: 'htm-edited-flag',
  frame: 'htm-frame',
  reveal: 'htm-reveal',
} as const

export type EntityId = (typeof E)[keyof typeof E]

/** Left edge of the nth tray slot (cards, ghost and verify share one row). */
export const slotX = (slot: number) => 46 + slot * 140
export const SLOT_Y = 148
export const SLOT_SIZE = 100
