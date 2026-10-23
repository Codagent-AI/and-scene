import type { EntityId } from './entities'

export interface SceneEntity {
  id: EntityId
  /** True only in the step that introduces this entity. */
  entering: boolean
}

/** Diagram state for one step: every entity visible so far, in stable order. */
export interface SceneState {
  entities: SceneEntity[]
}
