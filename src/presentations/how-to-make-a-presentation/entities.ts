/** This presentation's layoutId namespace and fixed canvas geometry (880 x 380). */
export interface Box {
  x: number
  y: number
  w: number
  h: number
}

export const ID = {
  you: 'htm/you',
  prompt: 'htm/prompt',
  skill: 'htm/skill',
  converse: 'htm/converse',
  question: 'htm/question',
  tray: 'htm/tray',
  card1: 'htm/card-1',
  card2: 'htm/card-2',
  card3: 'htm/card-3',
  link1: 'htm/link-1',
  link2: 'htm/link-2',
  morph1: 'htm/morph-1',
  morph2: 'htm/morph-2',
  ghost: 'htm/ghost',
  depth: 'htm/depth',
  socket: 'htm/scene-kit',
  plug: 'htm/plug',
  verify: 'htm/verify',
  verifyLink: 'htm/verify-link',
  pass: 'htm/pass',
  modify: 'htm/modify',
  modifyLabel: 'htm/modify-label',
  flag: 'htm/flag',
  frame: 'htm/frame',
  frameLabel: 'htm/frame-label',
} as const

const CARD_Y = 170
const CARD = { y: CARD_Y, w: 130, h: 110 }

export const AT: Record<keyof typeof ID, Box> = {
  you: { x: 50, y: 40, w: 160, h: 64 },
  prompt: { x: 225, y: 22, w: 150, h: 32 },
  skill: { x: 670, y: 40, w: 160, h: 64 },
  converse: { x: 215, y: 74, w: 450, h: 2 },
  question: { x: 455, y: 30, w: 160, h: 32 },
  tray: { x: 14, y: 160, w: 700, h: 130 },
  card1: { x: 30, ...CARD },
  card2: { x: 205, ...CARD },
  card3: { x: 380, ...CARD },
  link1: { x: 160, y: 224, w: 45, h: 2 },
  link2: { x: 335, y: 224, w: 45, h: 2 },
  morph1: { x: 170, y: 196, w: 25, h: 24 },
  morph2: { x: 345, y: 196, w: 25, h: 24 },
  ghost: { x: 555, ...CARD },
  depth: { x: 50, y: 112, w: 160, h: 28 },
  socket: { x: 240, y: 304, w: 400, h: 44 },
  plug: { x: 425, y: 290, w: 30, h: 14 },
  verify: { x: 730, ...CARD },
  verifyLink: { x: 685, y: 224, w: 45, h: 2 },
  pass: { x: 770, y: 296, w: 40, h: 30 },
  modify: { x: 300, y: 95, w: 140, h: 70 },
  modifyLabel: { x: 450, y: 104, w: 80, h: 24 },
  flag: { x: 215, y: 146, w: 70, h: 20 },
  frame: { x: 4, y: 4, w: 872, h: 372 },
  frameLabel: { x: 600, y: 350, w: 260, h: 24 },
}

/** The tray widens in step 7 so the verify node is chained in the same row. */
export const TRAY_WIDE = 852

/** First step (1-based) in which each entity is on screen. */
export const FIRST_STEP: Record<keyof typeof ID, number> = {
  you: 1, prompt: 1,
  skill: 2, converse: 2, question: 2,
  tray: 3, card1: 3, link1: 3, morph1: 3,
  card2: 4, card3: 4, link2: 4, morph2: 4,
  ghost: 5, depth: 5,
  socket: 6, plug: 6,
  verify: 7, verifyLink: 7, pass: 7,
  modify: 8, modifyLabel: 8, flag: 8,
  frame: 9, frameLabel: 9,
}
