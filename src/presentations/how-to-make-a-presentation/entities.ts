import type { Rect } from '../../presentation-kit'

// This presentation's layoutId namespace. Ids are stable across every step.
export const E = {
  control: 'hmp/control',
  you: 'hmp/you',
  prompt: 'hmp/prompt',
  skill: 'hmp/skill',
  conversation: 'hmp/conversation',
  question: 'hmp/question',
  tray: 'hmp/tray',
  ghost: 'hmp/ghost',
  socket: 'hmp/socket',
  socketPlug: 'hmp/socket-plug',
  verify: 'hmp/verify',
  verifyLink: 'hmp/verify-link',
  buildChip: 'hmp/build-chip',
  renderChip: 'hmp/render-chip',
  passChip: 'hmp/pass-chip',
  modifyArc: 'hmp/modify-arc',
  modifyLabel: 'hmp/modify-label',
  editedFlag: 'hmp/edited-flag',
  editedChip: 'hmp/edited-chip',
  frame: 'hmp/frame',
  frameLabel: 'hmp/frame-label',
  card: (i: number) => `hmp/card-${i}`,
  link: (i: number) => `hmp/link-${i}`,
  linkLabel: (i: number) => `hmp/link-label-${i}`,
} as const

// Fixed 880 x 380 design-canvas coordinates.
export const AT: Record<string, Rect> = {
  control: { x: 40, y: 6, w: 150, h: 26 },
  you: { x: 40, y: 40, w: 150, h: 56 },
  prompt: { x: 40, y: 106, w: 150, h: 34 },
  skill: { x: 690, y: 40, w: 150, h: 56 },
  question: { x: 380, y: 38, w: 120, h: 26 },
  tray: { x: 30, y: 150, w: 820, h: 150 },
  ghost: { x: 598, y: 170, w: 108, h: 110 },
  socket: { x: 330, y: 314, w: 220, h: 48 },
  verify: { x: 744, y: 170, w: 92, h: 110 },
  buildChip: { x: 754, y: 200, w: 72, h: 18 },
  renderChip: { x: 754, y: 224, w: 72, h: 18 },
  passChip: { x: 776, y: 248, w: 28, h: 24 },
  modifyLabel: { x: 590, y: 100, w: 60, h: 16 },
  editedFlag: { x: 322, y: 170, w: 108, h: 110 },
  editedChip: { x: 340, y: 152, w: 72, h: 16 },
  frame: { x: 2, y: 2, w: 876, h: 376 },
  frameLabel: { x: 640, y: 346, w: 220, h: 20 },
}

export const CARD_X = [46, 184, 322, 460]
export const cardAt = (i: number): Rect => ({ x: CARD_X[i] ?? 0, y: 170, w: 108, h: 110 })
export const linkLabelAt = (i: number): Rect => ({ x: (CARD_X[i] ?? 0) + 108 + 15 - 30, y: 284, w: 60, h: 14 })
