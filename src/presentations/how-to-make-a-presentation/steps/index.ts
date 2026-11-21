import type { Step } from '../../../presentation-kit'
import type { EntityId } from '../entities'
import { beats } from './beats'
import SampleScene from './Scene'
import type { SamplePayload } from './Scene'

const active: EntityId[] = []

export const steps: readonly Step<SamplePayload>[] = beats.map(({ introduces, ...narration }) => {
  active.push(...introduces)

  return {
    ...narration,
    groupKey: 'skill-workflow',
    Scene: SampleScene,
    payload: { entityIds: [...active] },
  }
})
