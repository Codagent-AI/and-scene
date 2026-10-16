import type { Point, Rect } from '../../presentation-kit/index.ts'

/** Stable `layoutId` namespace for this presentation's entities. */
export const E = {
  you: 'htmp.you',
  prompt: 'htmp.prompt',
  skill: 'htmp.skill',
  conversation: 'htmp.conversation',
  question: 'htmp.question',
  trayLabel: 'htmp.tray-label',
  card1: 'htmp.card-1',
  card2: 'htmp.card-2',
  card3: 'htmp.card-3',
  ghost: 'htmp.ghost',
  depth: 'htmp.depth',
  link1: 'htmp.link-1',
  link2: 'htmp.link-2',
  link3: 'htmp.link-3',
  link4: 'htmp.link-4',
  link1Label: 'htmp.link-1-label',
  link2Label: 'htmp.link-2-label',
  link3Label: 'htmp.link-3-label',
  socket: 'htmp.socket',
  plug: 'htmp.plug',
  verify: 'htmp.verify',
  verifyBuild: 'htmp.verify-build',
  verifyRender: 'htmp.verify-render',
  verifyPass: 'htmp.verify-pass',
  modify: 'htmp.modify',
  modifyLabel: 'htmp.modify-label',
  edited: 'htmp.edited',
  editedFlag: 'htmp.edited-flag',
  frame: 'htmp.frame',
  frameLabel: 'htmp.frame-label',
} as const

/** Design-canvas geometry (880 × 380). Entities accumulate and never move. */
const CARD_Y = 184
const CARD_W = 112
const CARD_H = 120
const SLOT = (n: number): Rect => ({ x: 36 + n * 168, y: CARD_Y, w: CARD_W, h: CARD_H })
const LINK_Y = CARD_Y + CARD_H / 2
const linkFrom = (n: number): Point => ({ x: SLOT(n).x + CARD_W + 4, y: LINK_Y })
const linkTo = (n: number): Point => ({ x: SLOT(n).x - 4, y: LINK_Y })
const linkLabelAt = (n: number): Rect => ({ x: SLOT(n).x - 56, y: LINK_Y - 24, w: 56, h: 16 })

export const G = {
  you: { x: 40, y: 16, w: 150, h: 96 },
  prompt: { x: 200, y: 12, w: 210, h: 36 },
  skill: { x: 690, y: 16, w: 150, h: 96 },
  conversation: { from: { x: 194, y: 64 }, to: { x: 686, y: 64 } },
  question: { x: 520, y: 32, w: 120, h: 26 },
  depth: { x: 40, y: 120, w: 150, h: 28 },
  trayLabel: { x: 36, y: 160, w: 120, h: 16 },
  cards: [SLOT(0), SLOT(1), SLOT(2)],
  ghost: SLOT(3),
  links: [
    { from: linkFrom(0), to: linkTo(1), label: linkLabelAt(1) },
    { from: linkFrom(1), to: linkTo(2), label: linkLabelAt(2) },
    { from: linkFrom(2), to: linkTo(3), label: linkLabelAt(3) },
  ],
  verify: { x: 708, y: CARD_Y, w: 136, h: CARD_H },
  verifyLink: { from: { x: SLOT(3).x + CARD_W + 4, y: LINK_Y }, to: { x: 704, y: LINK_Y } },
  verifyBuild: { x: 718, y: 222, w: 56, h: 22 },
  verifyRender: { x: 778, y: 222, w: 56, h: 22 },
  verifyPass: { x: 724, y: 258, w: 104, h: 26 },
  socket: { x: 188, y: 330, w: 312, h: 32 },
  plug: { from: { x: 344, y: 328 }, to: { x: 344, y: 308 } },
  modify: { from: { x: 440, y: 70 }, to: { x: 428, y: 180 }, bend: 36 },
  modifyLabel: { x: 346, y: 112, w: 64, h: 16 },
  edited: { x: 368, y: 180, w: 120, h: 128 },
  editedFlag: { x: 444, y: 160, w: 60, h: 18 },
  frame: { x: 4, y: 4, w: 872, h: 372 },
  frameLabel: { x: 540, y: 344, w: 320, h: 20 },
}
