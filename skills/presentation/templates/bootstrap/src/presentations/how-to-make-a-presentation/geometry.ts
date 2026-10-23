/** Design-canvas rectangles (880 x 380) for the sample's diagram. */
export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

export const CONVERSATION_Y = 28
export const TRAY_Y = 160
export const CARD_HEIGHT = 120
export const CARD_WIDTH = 140

export const RECT = {
  you: { x: 40, y: 28, width: 130, height: 52 },
  control: { x: 96, y: 58, width: 104, height: 20 },
  prompt: { x: 40, y: 92, width: 200, height: 34 },
  skill: { x: 690, y: 28, width: 150, height: 52 },
  link: { from: { x: 176, y: 54 }, to: { x: 686, y: 54 } },
  question: { x: 370, y: 12, width: 120, height: 26 },
  card1: { x: 40, y: TRAY_Y, width: CARD_WIDTH, height: CARD_HEIGHT },
  card2: { x: 204, y: TRAY_Y, width: CARD_WIDTH, height: CARD_HEIGHT },
  card3: { x: 368, y: TRAY_Y, width: CARD_WIDTH, height: CARD_HEIGHT },
  morphArrow: { from: { x: 182, y: 220 }, to: { x: 202, y: 220 } },
  morphLabel: { x: 162, y: 134, width: 60, height: 18 },
  ghost: { x: 532, y: TRAY_Y, width: CARD_WIDTH, height: CARD_HEIGHT },
  chain: { from: { x: 672, y: 220 }, to: { x: 694, y: 220 } },
  verify: { x: 696, y: TRAY_Y, width: 144, height: CARD_HEIGHT },
  socket: { x: 300, y: TRAY_Y + CARD_HEIGHT, width: 260, height: 40 },
  modifyArc: { from: { x: 765, y: 80 }, to: { x: 274, y: 160 } },
  modifyLabel: { x: 470, y: 88, width: 70, height: 18 },
  flag: { x: 196, y: 152, width: 156, height: 136 },
  reveal: { x: 12, y: 6, width: 856, height: 368 },
} as const

/** Top-level text-bearing nodes that must not collide with one another. */
export const TEXT_NODES: Readonly<Record<string, Rect>> = {
  you: RECT.you,
  control: RECT.control,
  prompt: RECT.prompt,
  skill: RECT.skill,
  question: RECT.question,
  card1: RECT.card1,
  card2: RECT.card2,
  card3: RECT.card3,
  morphLabel: RECT.morphLabel,
  ghost: RECT.ghost,
  verify: RECT.verify,
  socket: RECT.socket,
  modifyLabel: RECT.modifyLabel,
}
