import type { Step } from '../../../presentation-kit'
import { OUTLINE } from '../outline'
import { SampleScene } from './SampleScene'
import type { SampleState } from './SampleScene'

/** Nine beats of one evolving scene: a shared group keeps the scene mounted between steps. */
export const STEPS: readonly Step<SampleState>[] = OUTLINE.map((beat, index) => ({
  ...beat,
  groupKey: 'how-to-make-a-presentation',
  Scene: SampleScene,
  payload: { step: index + 1 },
}))
