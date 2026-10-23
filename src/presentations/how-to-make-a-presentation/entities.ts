import type { Geometry } from '../../presentation-kit/nodes/shared'

/**
 * Stable entity catalog for this presentation. Each id is also the layoutId, so an
 * entity that persists between steps morphs from its old geometry to its new one.
 * Coordinates are on the 880 × 380 design canvas.
 */
export type EntityId =
  | 'you'
  | 'prompt'
  | 'skill'
  | 'question'
  | 'talk-link'
  | 'tray'
  | 'card-1'
  | 'card-2'
  | 'card-3'
  | 'morph-note'
  | 'morph-link'
  | 'ghost'
  | 'depth-control'
  | 'socket'
  | 'verify'
  | 'chain-link'
  | 'pass-check'
  | 'modify-arc'
  | 'edited-flag'
  | 'reveal-frame'
  | 'reveal-label'

export type Entity =
  | { kind: 'box'; variant: string; text: string; geometry: Geometry; icon?: IconName }
  | { kind: 'label'; variant: string; text: string; geometry: Geometry }
  | { kind: 'chip'; variant: string; text: string; geometry: Geometry; icon?: IconName }
  | { kind: 'arrow'; variant: string; x: number; y: number; length: number; angle?: number; twoWay?: boolean }
  | { kind: 'frame'; variant: string; text: string; geometry: Geometry }
  | { kind: 'emphasis'; variant: string; geometry: Geometry }

export type IconName = 'User' | 'Bot' | 'Blocks' | 'CircleCheck'

const card = (x: number): Geometry => ({ x, y: 190, w: 150, h: 130 })

export const ENTITIES: Record<EntityId, Entity> = {
  you: { kind: 'box', variant: 'person', text: 'you', icon: 'User', geometry: { x: 40, y: 60, w: 120, h: 64 } },
  prompt: { kind: 'label', variant: 'bubble', text: 'a topic', geometry: { x: 200, y: 10, w: 220, h: 40 } },
  skill: { kind: 'box', variant: 'person', text: 'skill', icon: 'Bot', geometry: { x: 700, y: 60, w: 140, h: 64 } },
  question: { kind: 'chip', variant: 'question', text: 'the topic?', geometry: { x: 700, y: 18, w: 140, h: 30 } },
  'talk-link': { kind: 'arrow', variant: 'link', x: 160, y: 92, length: 540, twoWay: true },
  tray: { kind: 'box', variant: 'tray', text: '', geometry: { x: 40, y: 170, w: 800, h: 150 } },
  'card-1': { kind: 'box', variant: 'card', text: 'title · caption · visual', geometry: card(40) },
  'card-2': { kind: 'box', variant: 'card', text: 'title · caption · visual', geometry: card(206) },
  'card-3': { kind: 'box', variant: 'card', text: 'title · caption · visual', geometry: card(372) },
  'morph-note': { kind: 'label', variant: 'note', text: 'what morphs', geometry: { x: 170, y: 140, w: 170, h: 24 } },
  'morph-link': { kind: 'arrow', variant: 'morph', x: 190, y: 255, length: 16 },
  ghost: { kind: 'box', variant: 'ghost', text: 'not yet specified', geometry: card(538) },
  'depth-control': { kind: 'chip', variant: 'control', text: 'partial ↔ full', geometry: { x: 40, y: 130, w: 120, h: 26 } },
  socket: { kind: 'box', variant: 'socket', text: 'scene kit', icon: 'Blocks', geometry: { x: 300, y: 320, w: 280, h: 32 } },
  verify: { kind: 'box', variant: 'verify', text: 'verify', geometry: card(704) },
  'chain-link': { kind: 'arrow', variant: 'chain', x: 688, y: 255, length: 16 },
  'pass-check': { kind: 'chip', variant: 'pass', text: 'pass', icon: 'CircleCheck', geometry: { x: 790, y: 300, w: 50, h: 24 } },
  'modify-arc': { kind: 'arrow', variant: 'modify', x: 120, y: 124, length: 173, angle: 22 },
  'edited-flag': { kind: 'emphasis', variant: 'edited', geometry: { x: 202, y: 186, w: 158, h: 138 } },
  'reveal-frame': { kind: 'frame', variant: 'reveal', text: 'built this way', geometry: { x: 6, y: 4, w: 868, h: 370 } },
  'reveal-label': { kind: 'label', variant: 'reveal-label', text: 'this presentation', geometry: { x: 20, y: 350, w: 200, h: 20 } },
}

/**
 * What one step shows: the entities on screen, which of them are newcomers this step
 * (only newcomers get the Appear fade), and which entities are emphasized.
 */
export interface DiagramState {
  visible: EntityId[]
  added: EntityId[]
  emphasized: EntityId[]
}

export function diagramState(visible: EntityId[], added: EntityId[], emphasized: EntityId[] = []): DiagramState {
  return { visible, added, emphasized }
}
