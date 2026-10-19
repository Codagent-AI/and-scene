import type { Step } from '../../../presentation-kit'
import { StoryScene, type StoryPayload } from '../Scene'

export const step1: Step<StoryPayload> = {
  id: 'ask',
  era: 'the ask',
  title: 'You have a topic',
  caption: 'It starts with you, a topic, and mild overconfidence.',
  groupKey: 'story',
  Scene: StoryScene,
  payload: { stage: 1 },
}
