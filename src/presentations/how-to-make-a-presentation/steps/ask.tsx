/**
 * Steps 1-2 ("the ask"): the conversation forms. Both steps render the same
 * Scene instance (shared `groupKey`) so `you`, `prompt`, `skill`, and the
 * question link accumulate in place instead of remounting.
 */
import type { Step } from '../../../presentation-kit/types'
import { Scene, type BeatPayload } from './Scene'

const BASE: BeatPayload['visible'] = {
  you: false,
  prompt: false,
  skill: false,
  link: false,
  cardCount: 0,
  ghost: false,
  depthControl: false,
  kitSocket: false,
  verifyNode: false,
  verifyPass: false,
  modifyArc: false,
  editedCardIndex: null,
  revealFrame: false,
}

export const youHaveATopic: Step<BeatPayload> = {
  id: 'you-have-a-topic',
  section: 'the ask',
  title: 'You have a topic',
  caption: 'It starts with you, a topic, and mild overconfidence.',
  Scene,
  groupKey: 'ask',
  payload: {
    visible: { ...BASE, you: true, prompt: true },
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
    visible: { ...BASE, you: true, prompt: true, skill: true, link: true },
    introduced: ['skill', 'link', 'questionChip'],
  },
}
