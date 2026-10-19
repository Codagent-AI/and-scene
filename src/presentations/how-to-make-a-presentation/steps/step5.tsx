import type { Step } from '../../../presentation-kit'
import { StoryScene, type StoryPayload } from '../Scene'

export const step5: Step<StoryPayload> = {
  id: 'depth',
  era: 'the gathering',
  title: 'You set the depth',
  caption: 'Spell out every step, or sketch a few and see how it looks. You hold the gate.',
  groupKey: 'story',
  Scene: StoryScene,
  payload: { stage: 5 },
}
