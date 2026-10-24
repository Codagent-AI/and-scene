/**
 * This presentation's entity namespace. Every entity has a stable id and the stage
 * (step number) it first appears in; geometry is in 880 x 380 design-canvas units
 * and never changes once an entity exists.
 */
export type Glyph = 'user' | 'bot' | 'check' | 'flag'

interface EntityBase {
  id: string
  /** First stage (1-based step number) in which the entity exists. */
  since: number
  role: string
}

export interface RectEntity extends EntityBase {
  kind: 'box' | 'label' | 'chip' | 'frame' | 'emphasis'
  x: number
  y: number
  w: number
  h: number
  text?: string
  sub?: string
  parts?: readonly string[]
  glyph?: Glyph
  dashed?: boolean
  state?: string
}

export interface ArrowEntity extends EntityBase {
  kind: 'arrow'
  from: readonly [number, number]
  to: readonly [number, number]
  bend?: number
  head: 'end' | 'both' | 'none'
}

export type Entity = RectEntity | ArrowEntity

const CARD_PARTS = ['title', 'caption', 'visual'] as const
const card = (n: number, x: number, since: number): RectEntity => ({
  id: `card-${n}`, since, role: 'step-card', kind: 'box', x, y: 176, w: 120, h: 108, parts: CARD_PARTS,
})

export const ENTITIES: readonly Entity[] = [
  { id: 'you', since: 1, role: 'you', kind: 'box', x: 30, y: 78, w: 130, h: 50, text: 'you', glyph: 'user' },
  { id: 'prompt', since: 1, role: 'prompt', kind: 'chip', x: 30, y: 34, w: 190, h: 36, text: 'a topic, roughly' },
  { id: 'skill', since: 2, role: 'skill', kind: 'box', x: 720, y: 78, w: 130, h: 50, text: 'skill', glyph: 'bot' },
  { id: 'conversation', since: 2, role: 'conversation', kind: 'arrow', from: [160, 103], to: [720, 103], head: 'both' },
  { id: 'question', since: 2, role: 'question', kind: 'chip', x: 400, y: 62, w: 120, h: 26, text: 'which topic?' },
  { id: 'tray', since: 3, role: 'tray', kind: 'arrow', from: [30, 292], to: [850, 292], head: 'none' },
  { id: 'tray-route', since: 3, role: 'route', kind: 'label', x: 640, y: 296, w: 210, h: 18, text: '/your-presentation' },
  card(1, 30, 3),
  { id: 'link-1', since: 3, role: 'morph-link', kind: 'arrow', from: [150, 240], to: [200, 240], head: 'end' },
  { id: 'link-1-chip', since: 3, role: 'morph-label', kind: 'chip', x: 153, y: 212, w: 44, h: 18, text: 'morph' },
  card(2, 200, 4),
  card(3, 370, 4),
  { id: 'link-2', since: 4, role: 'morph-link', kind: 'arrow', from: [320, 240], to: [370, 240], head: 'end' },
  { id: 'link-2-chip', since: 4, role: 'morph-label', kind: 'chip', x: 323, y: 212, w: 44, h: 18, text: 'morph' },
  { id: 'ghost', since: 5, role: 'ghost-card', kind: 'box', x: 540, y: 176, w: 120, h: 108, text: '?', sub: 'unspecified', dashed: true },
  { id: 'depth', since: 5, role: 'depth-control', kind: 'chip', x: 30, y: 134, w: 130, h: 24, text: 'partial ↔ full' },
  { id: 'scene-kit', since: 6, role: 'scene-kit', kind: 'box', x: 60, y: 324, w: 450, h: 38, text: 'scene kit · boxes · arrows · motion' },
  { id: 'scene-kit-plug', since: 6, role: 'plug', kind: 'arrow', from: [285, 324], to: [285, 292], head: 'end' },
  { id: 'verify', since: 7, role: 'verify', kind: 'box', x: 710, y: 176, w: 140, h: 108, text: 'verify', sub: 'build + render' },
  { id: 'chain', since: 7, role: 'chain', kind: 'arrow', from: [660, 230], to: [710, 230], head: 'end' },
  { id: 'verify-pass', since: 7, role: 'pass', kind: 'chip', x: 808, y: 184, w: 32, h: 24, glyph: 'check', state: 'pass' },
  { id: 'modify', since: 8, role: 'modify-arc', kind: 'arrow', from: [785, 128], to: [300, 176], bend: -20, head: 'end' },
  { id: 'modify-label', since: 8, role: 'modify-label', kind: 'label', x: 560, y: 134, w: 150, h: 18, text: 'edit in place' },
  { id: 'edited-flag', since: 8, role: 'flag', kind: 'chip', x: 204, y: 152, w: 64, h: 18, text: 'edited', glyph: 'flag' },
  { id: 'edited-ring', since: 8, role: 'flagged-card', kind: 'emphasis', x: 196, y: 172, w: 128, h: 116 },
  { id: 'reveal', since: 9, role: 'reveal-frame', kind: 'frame', x: 6, y: 2, w: 868, h: 376 },
  { id: 'reveal-label', since: 9, role: 'reveal-label', kind: 'chip', x: 270, y: 8, w: 340, h: 20, text: "you're looking at the skill's own output" },
]

export const entitiesAt = (stage: number) => ENTITIES.filter((e) => e.since <= stage)

export const ID = Object.fromEntries(ENTITIES.map((e) => [e.id, e.id])) as Record<string, string>
