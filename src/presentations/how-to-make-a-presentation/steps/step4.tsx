import type { Step } from '../../../presentation-kit'
import { StoryScene, type StoryPayload } from '../Scene'

export const step4: Step<StoryPayload> = {
  id: 'grows',
  era: 'the gathering',
  title: 'The deck grows',
  caption: 'Same shapes, new beats. Every answer extends the story without redrawing it.',
  groupKey: 'story',
  Scene: StoryScene,
  payload: { stage: 4 },
}
