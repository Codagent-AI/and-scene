import type { Placement } from '../../presentation-kit'

/** This presentation's `layoutId` namespace: every entity id lives under `starter/`. */
const entity = (name: string) => `starter/${name}`

export interface EntityDef {
  id: string
  label: string
  at: Placement
  /** The step (1-based) at which the entity first appears; it then persists. */
  introducedAt: number
}

/** Replace these with the entities of your own story; ids must stay stable across steps. */
export const ENTITIES: EntityDef[] = [
  { id: entity('idea'), label: 'Idea', at: { x: 60, y: 140, w: 200, h: 90 }, introducedAt: 1 },
  { id: entity('result'), label: 'Result', at: { x: 620, y: 140, w: 200, h: 90 }, introducedAt: 2 },
  { id: entity('summary'), label: 'Summary', at: { x: 340, y: 270, w: 200, h: 70 }, introducedAt: 3 },
]
