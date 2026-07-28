/**
 * Steps 1-2 ("the ask"): the conversation forms. Both steps render the same
 * Scene instance (shared `groupKey`) so `you`, `prompt`, `skill`, and the
 * question link accumulate in place instead of remounting.
 */
import type { Step } from '../../../presentation-kit/types'
import { Scene, NONE_VISIBLE, type BeatPayload } from './Scene'

export const youHaveATopic: Step<BeatPayload> = {
  id: 'you-have-a-topic',
  section: 'the ask',
  title: 'You have a topic',
  caption: 'It starts with you, a topic, and mild overconfidence.',
  Scene,
  groupKey: 'ask',
  payload: {
    visible: { ...NONE_VISIBLE, you: true, prompt: true },
    introduced: ['you', 'prompt'],
  },
}

export const skillInterviewsYou: Step<BeatPayload> = {
  id: 'skill-interviews-you',
  section: 'the ask',
  title: 'The skill interviews you',
  caption: 'One question at a time: the topic, the look, then each beat of the story.',
  Scene,
  groupKey: 'ask',
  payload: {
    visible: { ...NONE_VISIBLE, you: true, prompt: true, skill: true, link: true },
    introduced: ['skill', 'link', 'questionChip'],
  },
}
