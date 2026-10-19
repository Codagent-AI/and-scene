/**
 * The sample's layoutId namespace. One evolving scene: entities accumulate by
 * `first` (the 1-based step they appear in) and are never moved or resized.
 */
export type Point = readonly [number, number]

interface Base {
  id: string
  /** 1-based step in which the entity first appears. */
  first: number
}

export type EntityDef = Base &
  (
    | { kind: 'node'; x: number; y: number; w: number; h: number; text: string; icon?: 'you' | 'skill' | 'route' }
    | { kind: 'card'; x: number; y: number; w: number; h: number }
    | { kind: 'ghost'; x: number; y: number; w: number; h: number; text: string }
    | { kind: 'tray'; x: number; y: number; w: number; h: number }
    | { kind: 'chip'; x: number; y: number; w: number; h: number; text: string }
    | { kind: 'arrow'; from: Point; to: Point; bidirectional?: boolean }
    | { kind: 'label'; x: number; y: number; w: number; h: number; text: string }
    | { kind: 'check'; x: number; y: number; w: number; h: number; resolves: readonly string[] }
    | { kind: 'flag'; x: number; y: number; w: number; h: number }
    | { kind: 'frame'; x: number; y: number; w: number; h: number }
  )

const CARD_W = 96
const CARD_H = 90
const CARD_Y = 206
const cardX = (slot: number) => 56 + slot * 132
const card = (n: number, first: number): EntityDef => ({
  id: `card-${n}`, first, kind: 'card', x: cardX(n - 1), y: CARD_Y, w: CARD_W, h: CARD_H,
})
const link = (n: number, first: number): EntityDef => ({
  id: `link-${n}`, first, kind: 'arrow',
  from: [cardX(n - 1) + CARD_W, CARD_Y + CARD_H / 2], to: [cardX(n), CARD_Y + CARD_H / 2],
})

export const ENTITIES: readonly EntityDef[] = [
  { id: 'you', first: 1, kind: 'node', x: 40, y: 20, w: 130, h: 56, text: 'you', icon: 'you' },
  { id: 'prompt', first: 1, kind: 'chip', x: 40, y: 88, w: 130, h: 30, text: 'a topic…' },
  { id: 'skill', first: 2, kind: 'node', x: 710, y: 20, w: 130, h: 56, text: 'skill', icon: 'skill' },
  { id: 'conversation', first: 2, kind: 'arrow', from: [172, 48], to: [708, 48], bidirectional: true },
  { id: 'question', first: 2, kind: 'chip', x: 380, y: 14, w: 130, h: 26, text: "what's the topic?" },
  { id: 'tray', first: 3, kind: 'tray', x: 40, y: 176, w: 800, h: 130 },
  card(1, 3),
  { id: 'morph-chip', first: 3, kind: 'chip', x: 128, y: 180, w: 84, h: 20, text: 'what morphs' },
  link(1, 3),
  card(2, 4), card(3, 4), card(4, 4), link(2, 4), link(3, 4),
  { id: 'ghost', first: 5, kind: 'ghost', x: cardX(4), y: CARD_Y, w: CARD_W, h: CARD_H, text: 'not yet specified' },
  { id: 'depth', first: 5, kind: 'chip', x: 40, y: 126, w: 130, h: 24, text: 'partial ↔ full' },
  { id: 'scene-kit', first: 6, kind: 'node', x: 300, y: 306, w: 240, h: 40, text: 'shared scene kit' },
  { id: 'verify', first: 7, kind: 'node', x: cardX(5), y: CARD_Y, w: CARD_W, h: CARD_H, text: 'verify', icon: 'skill' },
  { id: 'verify-chain', first: 7, kind: 'arrow', from: [cardX(4) + CARD_W, CARD_Y + CARD_H / 2], to: [cardX(5), CARD_Y + CARD_H / 2] },
  { id: 'verify-build', first: 7, kind: 'label', x: cardX(5) + 10, y: CARD_Y + 38, w: 76, h: 16, text: 'build' },
  { id: 'verify-render', first: 7, kind: 'label', x: cardX(5) + 10, y: CARD_Y + 62, w: 76, h: 16, text: 'render' },
  // the pass check resolves the build and render checks above it
  { id: 'verify-pass', first: 7, kind: 'check', x: cardX(5) + CARD_W - 16, y: CARD_Y - 8, w: 24, h: 24, resolves: ['verify-build', 'verify-render'] },
  { id: 'route', first: 8, kind: 'node', x: 380, y: 112, w: 130, h: 30, text: '/your-slug', icon: 'route' },
  { id: 'modify-arc', first: 8, kind: 'arrow', from: [445, 52], to: [445, 112] },
  { id: 'edit-link', first: 8, kind: 'arrow', from: [445, 142], to: [236, CARD_Y] },
  { id: 'edited-flag', first: 8, kind: 'flag', x: cardX(1) - 5, y: CARD_Y - 5, w: CARD_W + 10, h: CARD_H + 10 },
  { id: 'reveal-frame', first: 9, kind: 'frame', x: 6, y: 4, w: 868, h: 372 },
  { id: 'reveal-label', first: 9, kind: 'chip', x: 560, y: 348, w: 290, h: 22, text: 'a presentation made with this skill' },
]

/** Entities visible at a 1-based step; each step adds to the previous one. */
export function entitiesThrough(step: number): EntityDef[] {
  return ENTITIES.filter((entity) => entity.first <= step)
}
