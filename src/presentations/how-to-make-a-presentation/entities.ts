import type { Point, Rect } from '../../presentation-kit/index.ts'

/** Stable layoutId namespace for this presentation. */
export const ID = {
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
  link2: 'htm-link-2',
  link3: 'htm-link-3',
  ghost: 'htm-ghost',
  depth: 'htm-depth',
  socket: 'htm-socket',
  verify: 'htm-verify',
  verifyLink: 'htm-verify-link',
  route: 'htm-route',
  modify: 'htm-modify',
  edited: 'htm-edited',
  frame: 'htm-frame',
  frameLabel: 'htm-frame-label',
} as const

export type Role =
  | 'you'
  | 'prompt'
  | 'skill'
  | 'question'
  | 'tray'
  | 'card'
  | 'link'
  | 'ghost'
  | 'depth'
  | 'socket'
  | 'verify'
  | 'route'
  | 'edited'
  | 'frame-label'

interface Base {
  id: string
  /** 1-based step at which the entity first appears; it stays from then on. */
  stage: number
  /** Marks an intentional, readable overlap with a neighbour. */
  overlap?: boolean
}
export interface BoxEntity extends Base {
  kind: 'box' | 'chip' | 'label' | 'frame'
  role: Role
  rect: Rect
  text?: string
}
export interface ArrowEntity extends Base {
  kind: 'arrow'
  from: Point
  to: Point
  via?: Point
  bidirectional?: boolean
  role: 'conversation' | 'chain' | 'modify'
}
export type Entity = BoxEntity | ArrowEntity

const CARD_Y = 150
const CARD_W = 104
const CARD_H = 100
const cardX = (n: number) => 40 + n * 132

const card = (id: string, stage: number, n: number, text: string): BoxEntity => ({
  id, stage, kind: 'box', role: 'card', rect: { x: cardX(n), y: CARD_Y, w: CARD_W, h: CARD_H }, text,
})
const link = (id: string, stage: number, n: number, text: string): BoxEntity => ({
  id, stage, kind: 'label', role: 'link', rect: { x: cardX(n) + CARD_W + 14 - 42, y: 126, w: 84, h: 20 }, text,
})

/** Every entity of the evolving scene. Entities only accumulate; none is moved. */
export const ENTITIES: readonly Entity[] = [
  { id: ID.you, stage: 1, kind: 'box', role: 'you', rect: { x: 40, y: 12, w: 150, h: 64 }, text: 'you' },
  { id: ID.prompt, stage: 1, kind: 'box', role: 'prompt', rect: { x: 210, y: 12, w: 200, h: 28 }, text: '“Explain my topic”' },
  { id: ID.skill, stage: 2, kind: 'box', role: 'skill', rect: { x: 690, y: 12, w: 150, h: 64 }, text: 'skill' },
  { id: ID.talk, stage: 2, kind: 'arrow', role: 'conversation', from: { x: 190, y: 62 }, to: { x: 690, y: 62 }, bidirectional: true },
  { id: ID.question, stage: 2, kind: 'chip', role: 'question', rect: { x: 500, y: 28, w: 80, h: 26 }, text: 'which look?' },
  { id: ID.tray, stage: 3, kind: 'frame', role: 'tray', rect: { x: 28, y: 140, w: 824, h: 122 } },
  card(ID.card1, 3, 0, 'step 1'),
  link(ID.link1, 3, 0, 'box moves'),
  card(ID.card2, 4, 1, 'step 2'),
  link(ID.link2, 4, 1, 'arrow draws'),
  card(ID.card3, 4, 2, 'step 3'),
  link(ID.link3, 4, 2, 'label swaps'),
  card(ID.card4, 4, 3, 'step 4'),
  { id: ID.ghost, stage: 5, kind: 'box', role: 'ghost', rect: { x: cardX(4), y: CARD_Y, w: CARD_W, h: CARD_H }, text: 'not yet specified' },
  { id: ID.depth, stage: 5, kind: 'box', role: 'depth', rect: { x: 40, y: 82, w: 150, h: 26 }, text: 'partial ↔ full' },
  { id: ID.socket, stage: 6, kind: 'box', role: 'socket', overlap: true, rect: { x: 40, y: 258, w: 500, h: 34 }, text: 'shared scene kit' },
  { id: ID.verify, stage: 7, kind: 'box', role: 'verify', rect: { x: 700, y: CARD_Y, w: 140, h: CARD_H } },
  { id: ID.verifyLink, stage: 7, kind: 'arrow', role: 'chain', from: { x: 676, y: 200 }, to: { x: 698, y: 200 } },
  { id: ID.route, stage: 8, kind: 'box', role: 'route', rect: { x: 40, y: 318, w: 800, h: 34 }, text: '/your-presentation' },
  { id: ID.modify, stage: 8, kind: 'arrow', role: 'modify', from: { x: 40, y: 64 }, via: { x: 2, y: 200 }, to: { x: 38, y: 335 } },
  { id: ID.edited, stage: 8, kind: 'chip', role: 'edited', overlap: true, rect: { x: 224, y: 155, w: 48, h: 16 }, text: 'edited' },
  { id: ID.frame, stage: 9, kind: 'frame', role: 'frame-label', rect: { x: 4, y: 2, w: 872, h: 374 } },
  { id: ID.frameLabel, stage: 9, kind: 'label', role: 'frame-label', rect: { x: 520, y: 356, w: 340, h: 18 }, text: 'this presentation, built with the skill' },
]

export const CANVAS = { width: 880, height: 380 } as const
export const stageEntities = (stage: number) => ENTITIES.filter((e) => e.stage <= stage)
