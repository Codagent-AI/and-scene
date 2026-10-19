import type { Step } from '../../../presentation-kit'
import { StoryScene, type StoryPayload } from '../Scene'

export const step8: Step<StoryPayload> = {
  id: 'loop',
  era: 'the loop',
  title: 'Changed your mind? Loop it.',
  caption: 'Point at a step and ask. The skill edits the scene in place — nothing is redrawn from scratch.',
  groupKey: 'story',
  Scene: StoryScene,
  payload: { stage: 8 },
}
