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

const CARD_W = 110
const CARD_H = 96
const CARD_Y = 160
const slot = (i: number) => 44 + i * 160

export const ENTITIES: readonly EntityDef[] = [
  { id: 'you', since: 1, x: 40, y: 28, width: 110, height: 52 },
  { id: 'prompt', since: 1, x: 160, y: 64, width: 200, height: 32 },
  { id: 'skill', since: 2, x: 730, y: 28, width: 110, height: 52 },
  { id: 'question', since: 2, x: 390, y: 22, width: 100, height: 24 },
  { id: 'tray', since: 3, x: 20, y: 138, width: 840, height: 144 },
  { id: 'step-card-1', since: 3, x: slot(0), y: CARD_Y, width: CARD_W, height: CARD_H },
  { id: 'step-card-2', since: 4, x: slot(1), y: CARD_Y, width: CARD_W, height: CARD_H },
  { id: 'step-card-3', since: 4, x: slot(2), y: CARD_Y, width: CARD_W, height: CARD_H },
  { id: 'morph-label-1-2', since: 4, x: slot(0) + CARD_W, y: 188, width: 50, height: 16 },
  { id: 'morph-label-2-3', since: 4, x: slot(1) + CARD_W, y: 188, width: 50, height: 16 },
  { id: 'ghost-card', since: 5, x: slot(3), y: CARD_Y, width: CARD_W, height: CARD_H },
  { id: 'depth-control', since: 5, x: 40, y: 84, width: 110, height: 26 },
  { id: 'scene-kit', since: 6, x: 340, y: 270, width: 200, height: 40 },
  { id: 'verify', since: 7, x: slot(4), y: CARD_Y, width: CARD_W, height: CARD_H },
  { id: 'verify-check', since: 7, x: slot(4) + 43, y: 262, width: 24, height: 24 },
  { id: 'route', since: 8, x: 700, y: 330, width: 120, height: 28 },
  { id: 'edited-flag', since: 8, x: slot(1) + 70, y: 148, width: 48, height: 20 },
  { id: 'frame', since: 9, x: 4, y: 2, width: 872, height: 374 },
  { id: 'frame-label', since: 9, x: 300, y: 346, width: 280, height: 22 },
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
  { id: 'link', since: 2, from: [150, 54], to: [730, 54], bidirectional: true },
  { id: 'link-1-2', since: 4, from: [cardRight(0), MID], to: [slot(1), MID] },
  { id: 'link-2-3', since: 4, from: [cardRight(1), MID], to: [slot(2), MID] },
  { id: 'link-3-ghost', since: 5, from: [cardRight(2), MID], to: [slot(3), MID] },
  { id: 'link-ghost-verify', since: 7, from: [cardRight(3), MID], to: [slot(4), MID] },
  { id: 'modify', since: 8, from: [835, 80], to: [800, 330], bend: -40 },
]
