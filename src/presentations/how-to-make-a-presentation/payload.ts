import type { EntityId } from './entities'

export interface SampleEntity {
  id: EntityId
  /** True only in the step that introduces this entity. */
  entering: boolean
  /** Appearance state, such as `pass` or `edited`. */
  state?: string
}

/** Diagram state for one step: every entity visible so far, in stable order. */
export interface SampleState {
  entities: SampleEntity[]
}
