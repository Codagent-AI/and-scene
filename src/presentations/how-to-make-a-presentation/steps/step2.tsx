import type { Step } from '../../../presentation-kit'
import { StoryScene, type StoryPayload } from '../Scene'

export const step2: Step<StoryPayload> = {
  id: 'interview',
  era: 'the ask',
  title: 'The skill interviews you',
  caption: 'One question at a time: the topic, the look, then each beat of the story.',
  groupKey: 'story',
  Scene: StoryScene,
  payload: { stage: 2 },
}
