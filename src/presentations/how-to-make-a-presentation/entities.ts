import type { Point } from '../../presentation-kit/nodes/arrowGeometry.ts'

/** This presentation's layoutId namespace: every entity keeps its id for the whole talk. */
export const ids = {
  you: 'you',
  prompt: 'prompt',
  skill: 'skill',
  link: 'you-skill-link',
  question: 'question-chip',
  tray: 'tray',
  card1: 'card-1',
  card2: 'card-2',
  card3: 'card-3',
  card4: 'card-4',
  link1: 'card-link-1',
  link2: 'card-link-2',
  link3: 'card-link-3',
  morph1: 'card-morph-1',
  morph2: 'card-morph-2',
  morph3: 'card-morph-3',
  ghost: 'ghost-card',
  depth: 'depth-control',
  socket: 'scene-kit',
  verify: 'verify',
  pass: 'verify-pass',
  modify: 'modify-arc',
  modifyChip: 'modify-chip',
  edited: 'edited-flag',
  editedRing: 'edited-ring',
  frame: 'reveal-frame',
  frameLabel: 'reveal-label',
} as const

export type EntityId = (typeof ids)[keyof typeof ids]

interface Base {
  id: EntityId
  /** First step (1-based) the entity is on screen; it then stays for the rest of the talk. */
  since: number
  /** Presentation-owned styling hook. */
  role: string
}
interface Rect {
  x: number
  y: number
  w: number
  h: number
}
export type Entity =
  | (Base & Rect & { kind: 'box'; text: readonly string[] })
  | (Base & Rect & { kind: 'tray' })
  | (Base & Rect & { kind: 'label' | 'chip'; text: string })
  | (Base & Rect & { kind: 'frame' | 'emphasis' })
  | (Base & { kind: 'arrow'; from: Point; to: Point; both?: boolean })

const CARD_Y = 150
const CARD_W = 110
const CARD_H = 114
const cardX = (i: number) => 32 + i * 134
const PARTS = ['title', 'caption', 'visual'] as const

const card = (id: EntityId, i: number, since: number): Entity => ({
  kind: 'box', id, since, role: 'step-card', x: cardX(i), y: CARD_Y, w: CARD_W, h: CARD_H, text: PARTS,
})
const cardLink = (id: EntityId, chip: EntityId, i: number, since: number): Entity[] => [
  { kind: 'arrow', id, since, role: 'card-link', from: { x: cardX(i) + CARD_W + 2, y: CARD_Y + 60 }, to: { x: cardX(i + 1) - 2, y: CARD_Y + 60 } },
  { kind: 'chip', id: chip, since, role: 'morph-chip', x: cardX(i) + CARD_W - 1, y: CARD_Y + 28, w: 26, h: 20, text: '⇄' },
]

/** Cumulative scene content: nothing is rearranged, entities only join. */
export const ENTITIES: readonly Entity[] = [
  { kind: 'box', id: ids.you, since: 1, role: 'actor', x: 20, y: 40, w: 120, h: 56, text: ['you'] },
  { kind: 'label', id: ids.prompt, since: 1, role: 'prompt', x: 20, y: 8, w: 200, h: 26, text: 'prompt: a topic' },
  { kind: 'box', id: ids.skill, since: 2, role: 'actor', x: 740, y: 40, w: 120, h: 56, text: ['skill'] },
  { kind: 'arrow', id: ids.link, since: 2, role: 'conversation-link', from: { x: 142, y: 68 }, to: { x: 738, y: 68 }, both: true },
  { kind: 'chip', id: ids.question, since: 2, role: 'question-chip', x: 405, y: 36, w: 70, h: 24, text: 'question' },
  { kind: 'tray', id: ids.tray, since: 3, role: 'tray', x: 20, y: 134, w: 840, h: 150 },
  card(ids.card1, 0, 3),
  ...cardLink(ids.link1, ids.morph1, 0, 3),
  card(ids.card2, 1, 4),
  ...cardLink(ids.link2, ids.morph2, 1, 4),
  card(ids.card3, 2, 4),
  ...cardLink(ids.link3, ids.morph3, 2, 4),
  card(ids.card4, 3, 4),
  { kind: 'box', id: ids.ghost, since: 5, role: 'ghost-card', x: cardX(4), y: CARD_Y, w: CARD_W, h: CARD_H, text: ['unspecified'] },
  { kind: 'box', id: ids.depth, since: 5, role: 'depth-control', x: 20, y: 100, w: 140, h: 26, text: ['partial ↔ full'] },
  { kind: 'box', id: ids.socket, since: 6, role: 'scene-kit', x: 360, y: 270, w: 160, h: 40, text: ['scene kit'] },
  { kind: 'box', id: ids.verify, since: 7, role: 'verify', x: cardX(5), y: CARD_Y, w: CARD_W, h: CARD_H, text: ['verify', 'build + render'] },
  { kind: 'chip', id: ids.pass, since: 7, role: 'pass', x: cardX(5) + 40, y: CARD_Y + 82, w: 30, h: 24, text: '✓' },
  { kind: 'arrow', id: ids.modify, since: 8, role: 'modify-arc', from: { x: 440, y: 80 }, to: { x: cardX(2) + CARD_W / 2, y: CARD_Y - 2 } },
  { kind: 'chip', id: ids.modifyChip, since: 8, role: 'modify-chip', x: 450, y: 100, w: 60, h: 22, text: 'modify' },
  { kind: 'emphasis', id: ids.editedRing, since: 8, role: 'edited-ring', x: cardX(2) - 4, y: CARD_Y - 4, w: CARD_W + 8, h: CARD_H + 8 },
  { kind: 'chip', id: ids.edited, since: 8, role: 'edited-flag', x: cardX(2) + 20, y: CARD_Y + CARD_H - 4, w: 70, h: 22, text: 'edited' },
  { kind: 'frame', id: ids.frame, since: 9, role: 'reveal-frame', x: 4, y: 4, w: 872, h: 372 },
  { kind: 'label', id: ids.frameLabel, since: 9, role: 'reveal-label', x: 300, y: 338, w: 280, h: 28, text: 'an example of the skill’s own output' },
]
