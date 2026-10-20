import { SceneLayer, type SceneProps } from '../../presentation-kit/index.ts'
import { STEP_MODULES } from './modules.ts'

export interface SamplePayload {
  /** Number of steps whose entities are on screen (1-based). */
  upTo: number
}

/** One persistent scene: entities accumulate step by step and are never rearranged. */
export function SampleScene({ payload }: SceneProps<SamplePayload>) {
  return <SceneLayer>{STEP_MODULES.slice(0, payload.upTo).flatMap((m) => m.entities())}</SceneLayer>
}
