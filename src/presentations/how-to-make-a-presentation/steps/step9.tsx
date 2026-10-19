import type { Step } from '../../../presentation-kit'
import { StoryScene, type StoryPayload } from '../Scene'

export const step9: Step<StoryPayload> = {
  id: 'reveal',
  era: 'the reveal',
  title: "You're looking at one",
  caption: 'This presentation was built exactly this way. Thanks for watching.',
  groupKey: 'story',
  Scene: StoryScene,
  payload: { stage: 9 },
}
