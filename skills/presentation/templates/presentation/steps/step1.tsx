import type { Step } from '../../../presentation-kit'
import { StoryScene, type StoryPayload } from '../Scene'

export const step1: Step<StoryPayload> = {
  id: 'idea',
  era: 'the setup',
  title: 'Start with an idea',
  caption: 'Every presentation starts as one entity on an otherwise empty canvas.',
  groupKey: 'story',
  Scene: StoryScene,
  payload: { stage: 1 },
}
