import type { Geometry } from '../../presentation-kit/nodes/shared'

/**
 * Stable entity ids for this presentation. Each id is also the layoutId, so an entity that
 * persists between steps morphs from its old geometry to its new one.
 */
export type EntityId = 'example-box'

export const ENTITIES: Record<EntityId, { text: string; geometry: Geometry }> = {
  'example-box': { text: 'example', geometry: { x: 40, y: 60, w: 160, h: 80 } },
}

/** What one step shows. Newcomers are derived from the previous step by the scene, not listed here. */
export interface DiagramState {
  visible: EntityId[]
  emphasized: EntityId[]
}

export function diagramState(visible: EntityId[], emphasized: EntityId[] = []): DiagramState {
  return { visible, emphasized }
}
