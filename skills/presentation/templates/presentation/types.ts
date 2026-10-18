import type { Step } from '../../presentation-kit'

export interface ScenePayload {
  /** 1-based step number whose entities are on screen. */
  step: number
}

export type TalkStep = Step<ScenePayload>
