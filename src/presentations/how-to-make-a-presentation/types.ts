import type { Step } from '../../presentation-kit'

export interface SamplePayload {
  /** 1-based step number whose entities are on screen. */
  step: number
}

export type SampleStep = Step<SamplePayload>
