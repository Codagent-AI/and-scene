import type { Step } from '../../../presentation-kit'
import { prompt, you } from '../entities'
import { SampleScene } from '../Scene'
import type { SamplePayload } from '../types'

export const entities = [you, prompt]

export const step: Step<SamplePayload> = {
  id: 'you-have-a-topic',
  era: 'the ask',
  title: 'You have a topic',
  caption: 'It starts with you, a topic, and mild overconfidence.',
  groupKey: 'scene',
  Scene: SampleScene,
  payload: { entities },
}
