import type { Step } from '../../../presentation-kit'
import { StoryScene, type StoryPayload } from '../Scene'

export const step3: Step<StoryPayload> = {
  id: 'answers',
  era: 'the gathering',
  title: 'Answers become steps',
  caption: 'Each answer lands as a step card — title, caption, visual — plus what morphs from one step into the next.',
  groupKey: 'story',
  Scene: StoryScene,
  payload: { stage: 3 },
}
