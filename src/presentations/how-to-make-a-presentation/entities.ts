import type { LucideIcon } from 'lucide-react'
import {
  Check,
  CircleHelp,
  MessageSquare,
  Pencil,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  User,
} from 'lucide-react'

/** The layoutId namespace of this presentation: every entity keeps one id for the whole talk. */
export const ID = {
  you: 'htp-you',
  prompt: 'htp-prompt',
  skill: 'htp-skill',
  talk: 'htp-talk-arrow',
  question: 'htp-question',
  tray: 'htp-tray',
  card1: 'htp-card-1',
  card2: 'htp-card-2',
  card3: 'htp-card-3',
  ghost: 'htp-ghost',
  link12: 'htp-link-1-2',
  link12Label: 'htp-link-1-2-label',
  link23: 'htp-link-2-3',
  link23Label: 'htp-link-2-3-label',
  depth: 'htp-depth',
  kit: 'htp-scene-kit',
  kitPlug: 'htp-scene-kit-plug',
  verifyLink: 'htp-verify-link',
  verify: 'htp-verify',
  verifyLabel: 'htp-verify-label',
  pass: 'htp-pass',
  route: 'htp-route',
  modify: 'htp-modify-arc',
  modifyChip: 'htp-modify-chip',
  edited: 'htp-edited-flag',
  editedRing: 'htp-edited-ring',
  frame: 'htp-frame',
  frameLabel: 'htp-frame-label',
} as const

export interface EntitySpec {
  id: string
  kind: 'box' | 'label' | 'chip' | 'arrow' | 'frame' | 'emphasis'
  className: string
  x?: number
  y?: number
  width?: number
  height?: number
  text?: string
  /** Sub-lines shown inside a card (title, caption, visual). */
  parts?: readonly string[]
  Icon?: LucideIcon
  from?: readonly [number, number]
  to?: readonly [number, number]
  via?: readonly [number, number]
  both?: boolean
}

const CARD_Y = 190
const cardX = (i: number) => 30 + 180 * i

export const you: EntitySpec = {
  id: ID.you, kind: 'box', className: 'htp-you', x: 30, y: 24, width: 150, height: 60, text: 'you', Icon: User,
}
export const prompt: EntitySpec = {
  id: ID.prompt, kind: 'chip', className: 'htp-prompt', x: 30, y: 92, width: 150, height: 30, text: 'prompt', Icon: MessageSquare,
}
export const skill: EntitySpec = {
  id: ID.skill, kind: 'box', className: 'htp-skill', x: 700, y: 24, width: 150, height: 60, text: 'skill', Icon: Sparkles,
}
export const talk: EntitySpec = {
  id: ID.talk, kind: 'arrow', className: 'htp-talk', from: [186, 54], to: [694, 54], both: true,
}
export const question: EntitySpec = {
  id: ID.question, kind: 'chip', className: 'htp-question', x: 390, y: 20, width: 100, height: 24, text: 'question?', Icon: CircleHelp,
}
export const tray: EntitySpec = {
  id: ID.tray, kind: 'label', className: 'htp-tray', x: 30, y: 160, width: 120, height: 20, text: 'step tray',
}
const card = (id: string, i: number): EntitySpec => ({
  id, kind: 'box', className: 'htp-card', x: cardX(i), y: CARD_Y, width: 140, height: 110,
  parts: ['title', 'caption', 'visual'],
})
export const card1 = card(ID.card1, 0)
export const card2 = card(ID.card2, 1)
export const card3 = card(ID.card3, 2)
export const ghost: EntitySpec = {
  id: ID.ghost, kind: 'box', className: 'htp-ghost', x: cardX(3), y: CARD_Y, width: 140, height: 110, text: 'not specified yet',
}
export const link12: EntitySpec = {
  id: ID.link12, kind: 'arrow', className: 'htp-link', from: [172, 245], to: [208, 245],
}
export const link12Label: EntitySpec = {
  id: ID.link12Label, kind: 'label', className: 'htp-link-label', x: 172, y: 218, width: 36, height: 14, text: 'morph',
}
export const link23: EntitySpec = {
  id: ID.link23, kind: 'arrow', className: 'htp-link', from: [352, 245], to: [388, 245],
}
export const link23Label: EntitySpec = {
  id: ID.link23Label, kind: 'label', className: 'htp-link-label', x: 352, y: 218, width: 36, height: 14, text: 'morph',
}
export const depth: EntitySpec = {
  id: ID.depth, kind: 'chip', className: 'htp-depth', x: 30, y: 130, width: 150, height: 26, text: 'partial ↔ full', Icon: SlidersHorizontal,
}
export const kit: EntitySpec = {
  id: ID.kit, kind: 'box', className: 'htp-kit', x: 210, y: 326, width: 360, height: 38, text: 'scene kit: boxes, arrows, motion',
}
export const kitPlug: EntitySpec = {
  id: ID.kitPlug, kind: 'arrow', className: 'htp-plug', from: [390, 326], to: [390, 302],
}
export const verifyLink: EntitySpec = {
  id: ID.verifyLink, kind: 'arrow', className: 'htp-link', from: [712, 215], to: [728, 215],
}
export const verify: EntitySpec = {
  id: ID.verify, kind: 'box', className: 'htp-verify', x: 730, y: CARD_Y, width: 120, height: 50, text: 'verify', Icon: ShieldCheck,
}
export const verifyLabel: EntitySpec = {
  id: ID.verifyLabel, kind: 'label', className: 'htp-verify-label', x: 730, y: 250, width: 120, height: 22, text: 'build + render',
}
export const pass: EntitySpec = {
  id: ID.pass, kind: 'chip', className: 'htp-pass', x: 775, y: 278, width: 30, height: 24, Icon: Check,
}
export const route: EntitySpec = {
  id: ID.route, kind: 'box', className: 'htp-route', x: 30, y: 326, width: 150, height: 38, text: 'route',
}
export const modify: EntitySpec = {
  id: ID.modify, kind: 'arrow', className: 'htp-modify', from: [196, 90], via: [270, 230], to: [150, 322],
}
export const modifyChip: EntitySpec = {
  id: ID.modifyChip, kind: 'chip', className: 'htp-modify-chip', x: 214, y: 100, width: 90, height: 26, text: 'modify', Icon: Pencil,
}
export const edited: EntitySpec = {
  id: ID.edited, kind: 'label', className: 'htp-edited', x: 250, y: 166, width: 60, height: 18, text: 'edited',
}
export const editedRing: EntitySpec = {
  id: ID.editedRing, kind: 'emphasis', className: 'htp-edited-ring', x: 205, y: 185, width: 150, height: 120,
}
export const frame: EntitySpec = {
  id: ID.frame, kind: 'frame', className: 'htp-frame', x: 4, y: 4, width: 872, height: 372,
}
export const frameLabel: EntitySpec = {
  id: ID.frameLabel, kind: 'label', className: 'htp-frame-label', x: 600, y: 336, width: 250, height: 24, text: 'a presentation made by the skill',
}
