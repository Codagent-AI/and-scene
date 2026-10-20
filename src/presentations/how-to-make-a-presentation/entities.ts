/** This presentation's layoutId namespace: every entity id and its fixed place on the 880 × 380 canvas. */
export interface Rect {
  x: number
  y: number
  w: number
  h: number
}

const card = (i: number): Rect => ({ x: 30 + 150 * i, y: 170, w: 88, h: 90 })

export const RECTS = {
  you: { x: 120, y: 16, w: 120, h: 56 },
  control: { x: 20, y: 30, w: 96, h: 28 },
  prompt: { x: 120, y: 82, w: 120, h: 26 },
  skill: { x: 730, y: 16, w: 120, h: 56 },
  question: { x: 440, y: 12, w: 100, h: 24 },
  'card-1': card(0),
  'card-2': card(1),
  'card-3': card(2),
  'card-4': card(3),
  ghost: card(4),
  verify: card(5),
  kit: { x: 30, y: 260, w: 688, h: 32 },
  'check-build': { x: 768, y: 268, w: 48, h: 20 },
  'check-render': { x: 820, y: 268, w: 52, h: 20 },
  pass: { x: 846, y: 174, w: 20, h: 20 },
  flag: { x: 190, y: 148, w: 60, h: 16 },
  modify: { x: 300, y: 104, w: 60, h: 20 },
  frame: { x: 4, y: 2, w: 872, h: 372 },
  'frame-label': { x: 320, y: 336, w: 240, h: 24 },
} as const satisfies Record<string, Rect>

export type EntityId = keyof typeof RECTS

export const CARD_IDS = ['card-1', 'card-2', 'card-3', 'card-4'] as const

export interface Point {
  x: number
  y: number
}

/** The conversation arrow between you and the skill. */
export const CHAT_ARROW: { from: Point; to: Point } = { from: { x: 250, y: 44 }, to: { x: 720, y: 44 } }

/** Links between consecutive items of the tray row; the first three carry a "what morphs" label. */
export const LINKS = [
  { id: 'link-1', from: { x: 122, y: 215 }, to: { x: 176, y: 215 }, label: 'moves' },
  { id: 'link-2', from: { x: 272, y: 215 }, to: { x: 326, y: 215 }, label: 'grows' },
  { id: 'link-3', from: { x: 422, y: 215 }, to: { x: 476, y: 215 }, label: 'relabels' },
  { id: 'link-4', from: { x: 572, y: 215 }, to: { x: 626, y: 215 }, label: '' },
  { id: 'link-5', from: { x: 722, y: 215 }, to: { x: 776, y: 215 }, label: '' },
] as const

export const MODIFY_ARC = 'M 480 56 C 480 120, 224 100, 224 166'

export const FOCUS_PAD = 6
