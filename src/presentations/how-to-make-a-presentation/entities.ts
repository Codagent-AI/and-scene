import { Bot, User } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { ENTER_DELAY } from '../../presentation-kit/constants.ts'
import type { Point } from '../../presentation-kit/nodes/arrowGeometry.ts'

/** This presentation's layoutId namespace: one stable id per entity on the shared canvas. */
export const ID = {
  you: 'how-to:you',
  prompt: 'how-to:prompt',
  skill: 'how-to:skill',
  conversation: 'how-to:conversation',
  question: 'how-to:question',
  tray: 'how-to:tray',
  card1: 'how-to:card-1',
  card2: 'how-to:card-2',
  card3: 'how-to:card-3',
  link12: 'how-to:link-1-2',
  link23: 'how-to:link-2-3',
  ghost: 'how-to:ghost',
  link3Ghost: 'how-to:link-3-ghost',
  depth: 'how-to:depth',
  kit: 'how-to:scene-kit',
  verify: 'how-to:verify',
  verifyBuild: 'how-to:verify-build',
  verifyRender: 'how-to:verify-render',
  verifyPass: 'how-to:verify-pass',
  linkGhostVerify: 'how-to:link-ghost-verify',
  modify: 'how-to:modify',
  edited: 'how-to:edited',
  frame: 'how-to:frame',
} as const

export type EntityId = (typeof ID)[keyof typeof ID]

interface Common {
  id: EntityId
  /** Hook for presentation CSS (`data-sample`). */
  variant: string
  /** Seconds a newcomer waits before fading in; defaults to the kit's enter delay. */
  delay?: number
  /** The entity intentionally stacks on others; the inspection helper skips its overlap warnings. */
  overlap?: boolean
}
interface Rect {
  x: number
  y: number
  w: number
  h: number
}

export type EntityDef = Common &
  (
    | ({ kind: 'box'; label?: string; icon?: LucideIcon; parts?: boolean } & Rect)
    | ({ kind: 'chip'; symbol: string; text?: string } & Rect)
    | { kind: 'link'; from: Point; to: Point; label?: string; labelAt?: Point; bidirectional?: boolean; bend?: number }
    | ({ kind: 'emphasis'; text: string } & Rect)
    | ({ kind: 'frame'; label: string } & Rect)
  )

const CARD_Y = 180
const CARD = { y: CARD_Y, w: 110, h: 90 }

export const ENTITIES: Record<EntityId, EntityDef> = {
  [ID.you]: { id: ID.you, kind: 'box', variant: 'actor', x: 30, y: 20, w: 130, h: 90, label: 'you', icon: User },
  [ID.prompt]: { id: ID.prompt, kind: 'box', variant: 'bubble', x: 175, y: 14, w: 210, h: 40, label: 'a talk about my topic' },
  [ID.skill]: { id: ID.skill, kind: 'box', variant: 'actor', x: 720, y: 20, w: 130, h: 90, label: 'skill', icon: Bot },
  [ID.conversation]: { id: ID.conversation, kind: 'link', variant: 'conversation', from: [160, 80], to: [720, 80], bidirectional: true },
  [ID.question]: { id: ID.question, kind: 'chip', variant: 'question', x: 410, y: 44, w: 110, h: 26, symbol: '?', text: 'one at a time' },
  [ID.tray]: { id: ID.tray, kind: 'box', variant: 'tray', x: 30, y: 160, w: 820, h: 130, label: 'your presentation' },
  [ID.card1]: { id: ID.card1, kind: 'box', variant: 'card', x: 40, ...CARD, label: 'step 1', parts: true },
  [ID.card2]: { id: ID.card2, kind: 'box', variant: 'card', x: 210, ...CARD, label: 'step 2', parts: true },
  [ID.card3]: { id: ID.card3, kind: 'box', variant: 'card', x: 380, ...CARD, label: 'step 3', parts: true },
  [ID.link12]: { id: ID.link12, kind: 'link', variant: 'link', from: [150, 225], to: [210, 225], label: 'morphs', labelAt: [152, 203] },
  [ID.link23]: { id: ID.link23, kind: 'link', variant: 'link', from: [320, 225], to: [380, 225], label: 'morphs', labelAt: [322, 203] },
  [ID.ghost]: { id: ID.ghost, kind: 'box', variant: 'ghost', x: 550, ...CARD, label: 'not yet specified' },
  [ID.link3Ghost]: { id: ID.link3Ghost, kind: 'link', variant: 'link', from: [490, 225], to: [550, 225] },
  [ID.depth]: { id: ID.depth, kind: 'chip', variant: 'depth', overlap: true, x: 40, y: 96, w: 110, h: 26, symbol: '◐', text: 'partial ↔ full' },
  [ID.kit]: { id: ID.kit, kind: 'box', variant: 'socket', overlap: true, x: 335, y: 280, w: 210, h: 40, label: 'shared scene kit' },
  [ID.verify]: { id: ID.verify, kind: 'box', variant: 'verify', x: 720, ...CARD, label: 'verify' },
  [ID.verifyBuild]: { id: ID.verifyBuild, kind: 'chip', variant: 'check', overlap: true, x: 738, y: 208, w: 74, h: 18, symbol: '', text: 'build' },
  [ID.verifyRender]: { id: ID.verifyRender, kind: 'chip', variant: 'check', overlap: true, x: 738, y: 228, w: 74, h: 18, symbol: '', text: 'render' },
  [ID.verifyPass]: { id: ID.verifyPass, kind: 'chip', variant: 'pass', overlap: true, delay: ENTER_DELAY + 0.5, x: 761, y: 248, w: 28, h: 18, symbol: '✓' },
  [ID.linkGhostVerify]: { id: ID.linkGhostVerify, kind: 'link', variant: 'link', from: [660, 225], to: [720, 225] },
  [ID.modify]: { id: ID.modify, kind: 'link', variant: 'modify', from: [150, 104], to: [262, 176], bend: -30, label: 'modify', labelAt: [236, 116] },
  [ID.edited]: { id: ID.edited, kind: 'emphasis', variant: 'flag', overlap: true, x: 204, y: 174, w: 122, h: 102, text: 'edited' },
  [ID.frame]: { id: ID.frame, kind: 'frame', variant: 'reveal', overlap: true, x: 6, y: 4, w: 868, h: 346, label: 'this talk was built exactly this way' },
}
