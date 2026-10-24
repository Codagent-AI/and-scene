import type { LucideIcon } from 'lucide-react'
import { Check, ShieldCheck, Sparkles, User } from 'lucide-react'

/**
 * This presentation's layoutId namespace. Every entity has one identity, one
 * geometry, and one role for the whole presentation: entities accumulate and
 * are never rearranged, redrawn, or reused for another role.
 */
export type EntityKind = 'box' | 'label' | 'chip' | 'frame' | 'emphasis'

export interface EntityDef {
  id: string
  kind: EntityKind
  /** First beat (1-based step number) this entity appears in. */
  beat: number
  x: number
  y: number
  w: number
  h: number
  text?: string
  icon?: LucideIcon
  tone?: string
}

export interface LinkDef {
  id: string
  beat: number
  from: { x: number; y: number }
  to: { x: number; y: number }
  bidirectional?: boolean
  tone?: string
}

const CARD_W = 120
const CARD_H = 104
const CARD_Y = 146
const CARD_X = [50, 240, 430]

const card = (n: number, beat: number): EntityDef[] => {
  const x = CARD_X[n - 1]
  const part = (suffix: string, text: string, dy: number, h: number): EntityDef => ({
    id: `card-${n}-${suffix}`,
    kind: 'label',
    beat,
    x: x + 10,
    y: CARD_Y + dy,
    w: CARD_W - 20,
    h,
    text,
    tone: suffix,
  })
  return [
    { id: `card-${n}`, kind: 'box', beat, x, y: CARD_Y, w: CARD_W, h: CARD_H, tone: 'card' },
    part('title', 'title', 4, 27),
    part('caption', 'caption', 34, 27),
    part('visual', 'visual', 64, 36),
  ]
}

export const ENTITIES: EntityDef[] = [
  // 1 the ask
  { id: 'you', kind: 'box', beat: 1, x: 30, y: 30, w: 120, h: 56, text: 'you', icon: User, tone: 'actor' },
  { id: 'prompt', kind: 'box', beat: 1, x: 165, y: 8, w: 190, h: 36, text: 'a topic', tone: 'bubble' },
  // 2 the skill interviews you
  { id: 'skill', kind: 'box', beat: 2, x: 730, y: 30, w: 120, h: 56, text: 'skill', icon: Sparkles, tone: 'actor' },
  { id: 'question', kind: 'chip', beat: 2, x: 470, y: 28, w: 90, h: 30, text: '?', tone: 'question' },
  // 3 answers become steps
  { id: 'tray', kind: 'box', beat: 3, x: 30, y: 130, w: 820, h: 176, tone: 'tray' },
  { id: 'tray-label', kind: 'label', beat: 3, x: 46, y: 280, w: 260, h: 22, text: 'your presentation route', tone: 'tray-label' },
  ...card(1, 3),
  { id: 'morph-label', kind: 'label', beat: 3, x: 170, y: 170, w: 70, h: 24, text: 'morph', tone: 'link-label' },
  // 4 the deck grows
  ...card(2, 4),
  ...card(3, 4),
  // 5 you set the depth
  { id: 'ghost-card', kind: 'box', beat: 5, x: 580, y: CARD_Y, w: CARD_W, h: CARD_H, text: '?', tone: 'ghost' },
  { id: 'depth', kind: 'chip', beat: 5, x: 24, y: 94, w: 190, h: 32, text: 'partial ↔ full', tone: 'depth' },
  // 6 the build
  { id: 'scene-kit', kind: 'box', beat: 6, x: 315, y: 292, w: 250, h: 44, text: 'shared scene kit', tone: 'socket' },
  // 7 checks its own work
  { id: 'verify', kind: 'box', beat: 7, x: 730, y: CARD_Y, w: 120, h: CARD_H, text: 'build + render', icon: ShieldCheck, tone: 'verify' },
  { id: 'verify-pass', kind: 'chip', beat: 7, x: 770, y: 262, w: 40, h: 24, text: '', icon: Check, tone: 'pass' },
  // 8 the loop
  { id: 'edited-flag', kind: 'emphasis', beat: 8, x: CARD_X[1] - 6, y: CARD_Y - 6, w: CARD_W + 12, h: CARD_H + 12, tone: 'edited' },
  { id: 'edited-label', kind: 'label', beat: 8, x: CARD_X[1], y: 256, w: CARD_W, h: 24, text: 'edited', tone: 'edited-label' },
  // 9 the reveal
  { id: 'reveal-frame', kind: 'frame', beat: 9, x: 6, y: 4, w: 868, h: 372, tone: 'reveal' },
  { id: 'reveal-label', kind: 'label', beat: 9, x: 570, y: 342, w: 290, h: 28, text: 'you are looking at one', tone: 'reveal-label' },
]

export const LINKS: LinkDef[] = [
  { id: 'talk', beat: 2, from: { x: 154, y: 66 }, to: { x: 726, y: 66 }, bidirectional: true, tone: 'talk' },
  { id: 'link-1-2', beat: 3, from: { x: 170, y: 198 }, to: { x: 240, y: 198 }, tone: 'morph' },
  { id: 'link-2-3', beat: 4, from: { x: 360, y: 198 }, to: { x: 430, y: 198 }, tone: 'morph' },
  { id: 'link-to-verify', beat: 7, from: { x: 700, y: 198 }, to: { x: 730, y: 198 }, tone: 'chain' },
]

/** Modify arc: reaches from the conversation down into the route (step 8). */
export const MODIFY_ARC = { id: 'modify-arc', beat: 8, d: 'M 790 90 C 790 140, 420 96, 290 142' } as const

export const BEATS = 9

/** Entity and link identities visible at a beat, in definition order. */
export function idsAt(beat: number): string[] {
  const ids = [...ENTITIES, ...LINKS, MODIFY_ARC].filter((e) => e.beat <= beat).map((e) => e.id)
  return ids
}
