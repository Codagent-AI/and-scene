/** layoutId namespace and canvas geometry for this presentation's one evolving scene. */
export const ID = {
  prompt: 'htp-prompt',
  you: 'htp-you',
  skill: 'htp-skill',
  link: 'htp-link',
  question: 'htp-question',
  tray: 'htp-tray',
  trayLabel: 'htp-tray-label',
  card: (i: number) => `htp-card-${i}`,
  cardLink: (i: number) => `htp-card-link-${i}`,
  morph: (i: number) => `htp-morph-${i}`,
  ghost: 'htp-ghost',
  depth: 'htp-depth',
  socket: 'htp-socket',
  verify: 'htp-verify',
  verifyLink: 'htp-verify-link',
  pass: 'htp-pass',
  modify: 'htp-modify',
  modifyLabel: 'htp-modify-label',
  flag: 'htp-flag',
  ring: 'htp-ring',
  frame: 'htp-frame',
  frameLabel: 'htp-frame-label',
} as const

const CARD_W = 120
const CARD_GAP = 35
const CARD_X0 = 70
export const CARD_Y = 185
export const CARD_H = 100

/** Left edge of the n-th slot in the tray row (cards, ghost, then verify). */
export const slotX = (i: number) => CARD_X0 + i * (CARD_W + CARD_GAP)
export { CARD_W }

export const EDITED_CARD = 1
