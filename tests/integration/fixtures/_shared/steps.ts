import type { Step } from '../../presentation-kit/index.ts'
import type { Beat } from './scenes.tsx'

export function twoSteps(Scene: Step<Beat>['Scene']): Step<Beat>[] {
  return [1, 2].map((beat) => ({
    id: `s${beat}`,
    era: beat === 1 ? 'one' : 'two',
    title: `Step ${beat}`,
    caption: `Caption ${beat}`,
    Scene,
    groupKey: 'main',
    payload: { beat },
  }))
}
