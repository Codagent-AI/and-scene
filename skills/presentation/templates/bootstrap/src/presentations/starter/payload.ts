import type { EntityId } from './entities'

export interface SceneEntity {
  id: EntityId
}

/** Diagram state for one step: every entity visible so far, in stable order. */
export interface SceneState {
  entities: SceneEntity[]
}
