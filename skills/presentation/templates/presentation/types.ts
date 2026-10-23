import type { EntitySpec } from './entities'

export interface ScenePayload {
  /** Every entity on screen at this step. Later steps keep earlier ids so they morph in place. */
  entities: readonly EntitySpec[]
}
