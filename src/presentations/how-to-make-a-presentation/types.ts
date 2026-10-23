import type { EntitySpec } from './entities'

export interface SamplePayload {
  /** Every entity on screen at this step; later steps only add to earlier ones. */
  entities: readonly EntitySpec[]
}
