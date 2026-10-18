import type { Rect } from '../../presentation-kit'

/**
 * The sample's layoutId namespace. Every entity appears at `since` (a one-based
 * step) and then stays where it first landed.
 */
export type EntitySpec =
  | { kind: 'box'; id: string; since: number; at: Rect; className: string; lines: string[] }
  | { kind: 'label'; id: string; since: number; at: Rect; className: string; text: string }
  | { kind: 'chip'; id: string; since: number; at: Rect; className: string; symbol: string; text?: string }
  | {
      kind: 'arrow'
      id: string
      since: number
      className: string
      from: readonly [number, number]
      to: readonly [number, number]
      via?: readonly [number, number]
      bidirectional?: boolean
    }
  | { kind: 'frame'; id: string; since: number; at: Rect; className: string }

export const CARD_STEPS = ['card-1', 'card-2', 'card-3', 'card-4'] as const
const CARD_W = 96
const CARD_PITCH = 146
const CARD_Y = 140
const cardX = (slot: number) => 30 + slot * CARD_PITCH
const cardRect = (slot: number): Rect => ({ x: cardX(slot), y: CARD_Y, w: CARD_W, h: 100 })

const card = (slot: number, since: number): EntitySpec => ({
  kind: 'box',
  id: `card-${slot + 1}`,
  since,
  at: cardRect(slot),
  className: 'node card',
  lines: [`step ${slot + 1}`, 'title', 'caption', 'visual'],
})

const link = (slot: number, since: number): EntitySpec[] => [
  {
    kind: 'arrow',
    id: `link-${slot + 1}-${slot + 2}`,
    since,
    className: 'link',
    from: [cardX(slot) + CARD_W + 4, 190],
    to: [cardX(slot + 1) - 4, 190],
  },
  {
    kind: 'label',
    id: `link-${slot + 1}-${slot + 2}-label`,
    since,
    at: { x: cardX(slot) + CARD_W + 7, y: 198, w: 40, h: 14 },
    className: 'link-label',
    text: 'morph',
  },
]

export const ENTITIES: readonly EntitySpec[] = [
  { kind: 'box', id: 'you', since: 1, at: { x: 30, y: 20, w: 110, h: 50 }, className: 'node actor', lines: ['you'] },
  { kind: 'box', id: 'prompt', since: 1, at: { x: 30, y: 78, w: 110, h: 30 }, className: 'node prompt', lines: ['prompt'] },
  { kind: 'box', id: 'skill', since: 2, at: { x: 730, y: 20, w: 120, h: 50 }, className: 'node actor', lines: ['skill'] },
  {
    kind: 'arrow',
    id: 'conversation',
    since: 2,
    className: 'conversation',
    from: [144, 45],
    to: [726, 45],
    bidirectional: true,
  },
  { kind: 'chip', id: 'question', since: 2, at: { x: 380, y: 12, w: 120, h: 26 }, className: 'chip question', symbol: '?', text: 'question' },
  { kind: 'label', id: 'tray', since: 3, at: { x: 30, y: 122, w: 80, h: 14 }, className: 'tray-label', text: 'step tray' },
  card(0, 3),
  card(1, 4),
  ...link(0, 4),
  card(2, 4),
  ...link(1, 4),
  card(3, 4),
  ...link(2, 4),
  {
    kind: 'box',
    id: 'ghost',
    since: 5,
    at: cardRect(4),
    className: 'node ghost',
    lines: ['?', 'unspecified'],
  },
  { kind: 'box', id: 'depth', since: 5, at: { x: 150, y: 78, w: 130, h: 30 }, className: 'node depth', lines: ['partial ↔ full'] },
  {
    kind: 'box',
    id: 'scene-kit',
    since: 6,
    at: { x: 200, y: 262, w: 360, h: 40 },
    className: 'node socket',
    lines: ['scene kit — boxes, arrows, motion'],
  },
  // The tray's bottom edge: a single rule under the assembled row of cards (not a frame).
  // The socket plugs into it through the gap between two cards, never into one card.
  { kind: 'label', id: 'tray-edge', since: 6, at: { x: 30, y: 244, w: 680, h: 2 }, className: 'tray-edge', text: '' },
  {
    kind: 'arrow',
    id: 'kit-plug',
    since: 6,
    className: 'plug',
    from: [cardX(2) - 25, 262],
    to: [cardX(2) - 25, 248],
  },
  {
    kind: 'box',
    id: 'verify',
    since: 7,
    at: { x: 760, y: 140, w: CARD_W, h: 100 },
    className: 'node verify',
    lines: ['verify', 'build · render'],
  },
  {
    kind: 'arrow',
    id: 'verify-link',
    since: 7,
    className: 'link',
    from: [cardX(4) + CARD_W + 4, 190],
    to: [756, 190],
  },
  { kind: 'chip', id: 'verify-pass', since: 7, at: { x: 786, y: 200, w: 44, h: 28 }, className: 'chip pass', symbol: '✓' },
  { kind: 'box', id: 'route', since: 8, at: { x: 700, y: 262, w: 156, h: 40 }, className: 'node route', lines: ['route'] },
  {
    kind: 'arrow',
    id: 'modify',
    since: 8,
    className: 'modify',
    from: [852, 45],
    via: [880, 290],
    to: [859, 282],
  },
  { kind: 'label', id: 'edited', since: 8, at: { x: cardX(1), y: 122, w: 96, h: 14 }, className: 'flag', text: 'edited' },
  { kind: 'frame', id: 'reveal-frame', since: 9, at: { x: 6, y: 4, w: 868, h: 372 }, className: 'frame' },
  {
    kind: 'label',
    id: 'reveal-label',
    since: 9,
    at: { x: 20, y: 340, w: 360, h: 18 },
    className: 'frame-label',
    text: 'this presentation — an example of the skill’s own output',
  },
]
