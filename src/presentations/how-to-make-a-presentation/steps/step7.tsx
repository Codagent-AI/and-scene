import type { Step } from '../../../presentation-kit'
import { StoryScene, type StoryPayload } from '../Scene'

export const step7: Step<StoryPayload> = {
  id: 'checks',
  era: 'the build',
  title: 'It checks its own work',
  caption: 'Before saying done, it builds and renders every step — and fixes what breaks.',
  groupKey: 'story',
  Scene: StoryScene,
  payload: { stage: 7 },
}
