import type { Step } from '../../../presentation-kit'
import { StoryScene, type StoryPayload } from '../Scene'

export const step2: Step<StoryPayload> = {
  id: 'result',
  era: 'the payoff',
  title: 'Watch it evolve',
  caption: 'New entities join the same scene; the ones already on screen stay put.',
  groupKey: 'story',
  Scene: StoryScene,
  payload: { stage: 2 },
}
