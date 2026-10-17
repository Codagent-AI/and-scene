import { ArrowLeftRight, Bot, Check, FileText, MessageCircleQuestion, PackageOpen, ShieldCheck, User } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { Placement } from '../../presentation-kit/nodes/props.ts'

/** The sample's `layoutId` namespace. Every entity keeps its id and coordinates once introduced. */
export type EntityKind = 'box' | 'label' | 'chip' | 'frame' | 'emphasis' | 'arrow' | 'card'

export interface Entity {
  id: string
  /** One-based step at which the entity first appears. */
  step: number
  kind: EntityKind
  role: string
  at?: Placement
  from?: { x: number; y: number }
  to?: { x: number; y: number }
  bend?: number
  bidirectional?: boolean
  text?: string
  Icon?: LucideIcon
  state?: string
}

const SLOT_X = [40, 210, 380, 550, 720]
const CARD_Y = 172
const CARD_W = 130
const CARD_H = 92
const card = (slot: number): Placement => ({ x: SLOT_X[slot], y: CARD_Y, w: CARD_W, h: CARD_H })
const link = (from: number, to: number) => ({
  from: { x: SLOT_X[from] + CARD_W + 4, y: CARD_Y + CARD_H / 2 },
  to: { x: SLOT_X[to] - 4, y: CARD_Y + CARD_H / 2 },
})
const gapLabel = (from: number): Placement => ({ x: SLOT_X[from] + CARD_W + 20 - 50, y: 272, w: 100, h: 20 })

export const ENTITIES: readonly Entity[] = [
  { id: 'you', step: 1, kind: 'box', role: 'you', at: { x: 40, y: 20, w: 150, h: 56 }, text: 'you', Icon: User },
  { id: 'prompt', step: 1, kind: 'label', role: 'prompt', at: { x: 40, y: 84, w: 150, h: 28 }, text: 'a topic…' },
  { id: 'skill', step: 2, kind: 'box', role: 'skill', at: { x: 690, y: 20, w: 150, h: 56 }, text: 'skill', Icon: Bot },
  { id: 'you-skill', step: 2, kind: 'arrow', role: 'conversation', from: { x: 194, y: 48 }, to: { x: 686, y: 48 }, bidirectional: true },
  { id: 'question-chip', step: 2, kind: 'chip', role: 'question', at: { x: 380, y: 14, w: 120, h: 24 }, text: 'which look?', Icon: MessageCircleQuestion },
  { id: 'tray', step: 3, kind: 'frame', role: 'tray', at: { x: 24, y: 146, w: 832, h: 154 } },
  { id: 'tray-label', step: 3, kind: 'label', role: 'tray-label', at: { x: 36, y: 150, w: 120, h: 18 }, text: 'step tray' },
  { id: 'card-1', step: 3, kind: 'card', role: 'step-card', at: card(0), text: 'step 1' },
  { id: 'card-2', step: 4, kind: 'card', role: 'step-card', at: card(1), text: 'step 2' },
  { id: 'card-3', step: 4, kind: 'card', role: 'step-card', at: card(2), text: 'step 3' },
  { id: 'link-1-2', step: 4, kind: 'arrow', role: 'link', ...link(0, 1) },
  { id: 'link-2-3', step: 4, kind: 'arrow', role: 'link', ...link(1, 2) },
  { id: 'link-1-2-label', step: 4, kind: 'label', role: 'link-label', at: gapLabel(0), text: 'moves' },
  { id: 'link-2-3-label', step: 4, kind: 'label', role: 'link-label', at: gapLabel(1), text: 're-labels' },
  { id: 'ghost-card', step: 5, kind: 'card', role: 'ghost-card', at: card(3), text: 'not yet specified' },
  { id: 'link-3-ghost', step: 5, kind: 'arrow', role: 'link ghost-link', ...link(2, 3) },
  { id: 'depth-control', step: 5, kind: 'chip', role: 'depth', at: { x: 205, y: 84, w: 150, h: 28 }, text: 'partial ↔ full', Icon: ArrowLeftRight },
  { id: 'scene-kit', step: 6, kind: 'box', role: 'socket', at: { x: 330, y: 300, w: 220, h: 44 }, text: 'scene kit', Icon: PackageOpen },
  { id: 'scene-kit-caption', step: 6, kind: 'label', role: 'socket-caption', at: { x: 330, y: 348, w: 220, h: 20 }, text: 'boxes · arrows · motion' },
  { id: 'verify', step: 7, kind: 'box', role: 'verify', at: card(4), text: 'verify', Icon: ShieldCheck },
  { id: 'link-ghost-verify', step: 7, kind: 'arrow', role: 'link', ...link(3, 4) },
  { id: 'verify-check', step: 7, kind: 'chip', role: 'check', at: { x: 820, y: 160, w: 32, h: 32 }, state: 'pass', Icon: Check },
  { id: 'verify-label', step: 7, kind: 'label', role: 'verify-label', at: { x: 720, y: 272, w: 130, h: 20 }, text: 'build + render' },
  { id: 'modify-arc', step: 8, kind: 'arrow', role: 'modify', from: { x: 765, y: 80 }, to: { x: 480, y: 166 }, bend: -30 },
  { id: 'modify-label', step: 8, kind: 'label', role: 'modify-label', at: { x: 560, y: 98, w: 70, h: 20 }, text: 'modify' },
  { id: 'edited-ring', step: 8, kind: 'emphasis', role: 'edited-ring', at: { x: 376, y: 168, w: 138, h: 100 } },
  { id: 'edited-flag', step: 8, kind: 'chip', role: 'edited-flag', at: { x: 386, y: 148, w: 64, h: 20 }, text: 'edited', Icon: FileText },
  { id: 'reveal-frame', step: 9, kind: 'frame', role: 'reveal-frame', at: { x: 6, y: 6, w: 868, h: 368 } },
  { id: 'reveal-label', step: 9, kind: 'label', role: 'reveal-label', at: { x: 600, y: 350, w: 260, h: 20 }, text: 'you are looking at one' },
]

export const visibleAt = (stepIndex: number) => ENTITIES.filter((e) => e.step <= stepIndex + 1)
