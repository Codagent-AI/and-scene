import { Boxes, Check, Flag, MessageSquare, ShieldCheck, Sparkles, User, type LucideIcon } from 'lucide-react'

/**
 * This presentation's `layoutId` namespace. Every entity is introduced at step `appearsAt` (1-based)
 * and then stays put: later steps add entities, they never move or redraw earlier ones.
 */
interface Base {
  id: string
  appearsAt: number
}
interface Positioned extends Base {
  x: number
  y: number
  width: number
  height: number
}
export type Entity =
  | (Positioned & { kind: 'box'; label: string; Icon?: LucideIcon; variant?: string; parts?: boolean; lines?: string[] })
  | (Positioned & { kind: 'label'; text: string })
  | (Base & { kind: 'arrow'; from: [number, number]; to: [number, number]; bend?: number; bidirectional?: boolean })
  | (Positioned & { kind: 'chip'; text: string; Icon?: LucideIcon })
  | (Positioned & { kind: 'emphasis'; Icon?: LucideIcon })
  | (Positioned & { kind: 'frame'; text: string })

const CARD_W = 96
const CARD_H = 112
const CARD_Y = 184
const cardX = (n: number) => 40 + 128 * (n - 1)
const MID_Y = CARD_Y + CARD_H / 2

function card(n: number, appearsAt: number): Entity {
  return {
    id: `card-${n}`, appearsAt, kind: 'box', label: `step ${n}`,
    x: cardX(n), y: CARD_Y, width: CARD_W, height: CARD_H, parts: true,
  }
}
function link(id: string, appearsAt: number, fromX: number, toX: number): Entity {
  return { id, appearsAt, kind: 'arrow', from: [fromX, MID_Y], to: [toX, MID_Y] }
}

export const ENTITIES: readonly Entity[] = [
  { id: 'you', appearsAt: 1, kind: 'box', label: 'you', Icon: User, x: 40, y: 24, width: 170, height: 60 },
  { id: 'prompt', appearsAt: 1, kind: 'box', label: 'a topic', Icon: MessageSquare, variant: 'bubble', x: 40, y: 96, width: 170, height: 34 },

  { id: 'skill', appearsAt: 2, kind: 'box', label: 'skill', Icon: Sparkles, x: 670, y: 24, width: 170, height: 60 },
  { id: 'conversation', appearsAt: 2, kind: 'arrow', from: [214, 54], to: [666, 54], bidirectional: true },
  { id: 'question', appearsAt: 2, kind: 'chip', text: 'question?', x: 390, y: 20, width: 100, height: 24 },

  { id: 'tray', appearsAt: 3, kind: 'label', text: 'tray', x: 40, y: 166, width: 60, height: 16 },
  card(1, 3),
  link('link-1', 3, cardX(1) + CARD_W, cardX(2)),
  { id: 'morph-label', appearsAt: 3, kind: 'label', text: 'what morphs', x: 107, y: 166, width: 90, height: 16 },

  card(2, 4), card(3, 4), card(4, 4),
  link('link-2', 4, cardX(2) + CARD_W, cardX(3)),
  link('link-3', 4, cardX(3) + CARD_W, cardX(4)),

  { id: 'ghost', appearsAt: 5, kind: 'box', label: 'not yet', variant: 'ghost', x: cardX(5), y: CARD_Y, width: CARD_W, height: CARD_H },
  link('link-4', 5, cardX(4) + CARD_W, cardX(5)),
  { id: 'depth-control', appearsAt: 5, kind: 'box', label: 'partial ↔ full', variant: 'control', x: 40, y: 134, width: 170, height: 24 },

  { id: 'scene-kit', appearsAt: 6, kind: 'box', label: 'shared scene kit', Icon: Boxes, variant: 'socket', x: 200, y: 316, width: 360, height: 40 },
  { id: 'plug', appearsAt: 6, kind: 'arrow', from: [380, 316], to: [380, CARD_Y + CARD_H + 2] },

  { id: 'verify', appearsAt: 7, kind: 'box', label: 'verify', Icon: ShieldCheck, lines: ['build', 'render'], x: cardX(6), y: CARD_Y, width: CARD_W, height: CARD_H },
  link('link-5', 7, cardX(5) + CARD_W, cardX(6)),
  { id: 'verify-pass', appearsAt: 7, kind: 'chip', text: 'pass', Icon: Check, x: cardX(6), y: 306, width: CARD_W, height: 26 },

  { id: 'route', appearsAt: 8, kind: 'chip', text: '/your-presentation', x: 330, y: 112, width: 200, height: 26 },
  { id: 'modify-arc', appearsAt: 8, kind: 'arrow', from: [440, 62], to: [440, 110], bend: 26 },
  { id: 'flag', appearsAt: 8, kind: 'emphasis', Icon: Flag, x: 236, y: 162, width: 28, height: 20 },

  { id: 'reveal-frame', appearsAt: 9, kind: 'frame', text: 'this very presentation', x: 8, y: 6, width: 864, height: 368 },
]
