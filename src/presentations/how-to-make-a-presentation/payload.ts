import { ID } from './entities'

/** Diagram state for a step; the entity set itself is driven by the step index. */
export interface SamplePayload {
  /** 1-based step number. */
  step: number
  /** Which side of the partial/full depth control is selected. */
  depth: 'partial' | 'full'
  /** Card flagged as edited by the modify loop (null before step 8). */
  editedCard: string | null
  /** Verification outcome shown on the verify node. */
  verify: 'idle' | 'pass'
}

export const PAYLOADS: readonly SamplePayload[] = Array.from({ length: 9 }, (_, i) => {
  const step = i + 1
  return {
    step,
    depth: step <= 5 ? 'partial' : 'full',
    editedCard: step >= 8 ? ID.card3 : null,
    verify: step >= 7 ? 'pass' : 'idle',
  }
})
