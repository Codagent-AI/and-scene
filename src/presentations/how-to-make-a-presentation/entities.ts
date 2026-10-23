/** This presentation's layoutId namespace: every entity has one stable id and geometry. */
export interface EntityDef {
  id: string
  /** First step (1-based) in which the entity appears; it then stays through the last step. */
  since: number
  x: number
  y: number
  width: number
  height: number
}

// Geometry is in canvas units. Text is sized for the fixed 880 x 380 canvas to stay legible
// when it is scaled down to a phone, so cards are few-word and the gaps are wide enough for labels.
const CARD_W = 108
const CARD_H = 106
const CARD_Y = 150
const GAP = 62
const slot = (i: number) => 30 + i * (CARD_W + GAP)

export const ENTITIES: readonly EntityDef[] = [
  { id: 'you', since: 1, x: 30, y: 24, width: 180, height: 48 },
  { id: 'prompt', since: 1, x: 230, y: 58, width: 380, height: 36 },
  { id: 'skill', since: 2, x: 670, y: 24, width: 180, height: 48 },
  { id: 'question', since: 2, x: 370, y: 10, width: 120, height: 28 },
  { id: 'tray', since: 3, x: 16, y: 120, width: 848, height: 160 },
  { id: 'step-card-1', since: 3, x: slot(0), y: CARD_Y, width: CARD_W, height: CARD_H },
  { id: 'step-card-2', since: 4, x: slot(1), y: CARD_Y, width: CARD_W, height: CARD_H },
  { id: 'step-card-3', since: 4, x: slot(2), y: CARD_Y, width: CARD_W, height: CARD_H },
  { id: 'morph-label-1-2', since: 4, x: slot(0) + CARD_W, y: 176, width: GAP, height: 24 },
  { id: 'morph-label-2-3', since: 4, x: slot(1) + CARD_W, y: 176, width: GAP, height: 24 },
  { id: 'ghost-card', since: 5, x: slot(3), y: CARD_Y, width: CARD_W, height: CARD_H },
  { id: 'depth-control', since: 5, x: 30, y: 80, width: 170, height: 32 },
  { id: 'scene-kit', since: 6, x: 330, y: 268, width: 220, height: 36 },
  { id: 'verify', since: 7, x: slot(4), y: CARD_Y, width: CARD_W, height: CARD_H },
  { id: 'verify-check', since: 7, x: slot(4) + 40, y: 260, width: 28, height: 26 },
  { id: 'route', since: 8, x: 760, y: 320, width: 96, height: 30 },
  { id: 'edited-flag', since: 8, x: slot(1) + 36, y: 126, width: 72, height: 26 },
  { id: 'frame', since: 9, x: 4, y: 2, width: 872, height: 374 },
  { id: 'frame-label', since: 9, x: 230, y: 344, width: 420, height: 28 },
]

export const entity = (id: string): EntityDef => {
  const found = ENTITIES.find((e) => e.id === id)
  if (!found) throw new Error(`unknown entity ${id}`)
  return found
}

export interface Edge {
  id: string
  since: number
  from: readonly [number, number]
  to: readonly [number, number]
  bend?: number
  bidirectional?: boolean
}

const cardRight = (i: number) => slot(i) + CARD_W
const MID = CARD_Y + CARD_H / 2

export const EDGES: readonly Edge[] = [
  { id: 'link', since: 2, from: [210, 48], to: [670, 48], bidirectional: true },
  { id: 'link-1-2', since: 4, from: [cardRight(0), MID], to: [slot(1), MID] },
  { id: 'link-2-3', since: 4, from: [cardRight(1), MID], to: [slot(2), MID] },
  { id: 'link-3-ghost', since: 5, from: [cardRight(2), MID], to: [slot(3), MID] },
  { id: 'link-ghost-verify', since: 7, from: [cardRight(3), MID], to: [slot(4), MID] },
  { id: 'modify', since: 8, from: [836, 72], to: [836, 320], bend: -24 },
]
