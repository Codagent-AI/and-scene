import type { Step } from '../../../presentation-kit'
import { ReferenceScene } from '../scene'
import type { ReferencePayload } from './types'

export type ReferenceStep = Step<ReferencePayload> & { entityIds: readonly string[] }

export function makeStep(step: Omit<ReferenceStep, 'groupKey' | 'Scene'>): ReferenceStep {
  return { ...step, groupKey: 'reference-scene', Scene: ReferenceScene }
}
