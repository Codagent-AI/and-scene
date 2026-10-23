import type { Step } from '../../../presentation-kit'
import { question, skill, talk } from '../entities'
import { SampleScene } from '../Scene'
import type { SamplePayload } from '../types'
import { entities as previous } from './01-ask'

export const entities = [...previous, skill, talk, question]

export const step: Step<SamplePayload> = {
  id: 'the-skill-interviews-you',
  era: 'the ask',
  title: 'The skill interviews you',
  caption: 'One question at a time: the topic, the look, then each beat of the story.',
  groupKey: 'scene',
  Scene: SampleScene,
  payload: { entities },
}
