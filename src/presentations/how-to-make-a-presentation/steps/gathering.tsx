/**
 * Steps 3-4 ("the gathering"): step cards land in a tray under the
 * conversation. Both steps share a `groupKey`/`Scene` instance so the tray
 * and its first card persist while later cards land beside them.
 */
import type { Step } from '../../../presentation-kit/types'
import { Scene, NONE_VISIBLE, type BeatPayload } from './Scene'

/** What the ask left on screen: the conversation, before any card lands. */
const CONVERSATION: BeatPayload['visible'] = {
  ...NONE_VISIBLE,
  you: true,
  prompt: true,
  skill: true,
  link: true,
}

export const answersBecomeSteps: Step<BeatPayload> = {
  id: 'answers-become-steps',
  section: 'the gathering',
  title: 'Answers become steps',
  caption:
    'Each answer lands as a step card — title, caption, visual — plus what morphs from one step into the next.',
  Scene,
  groupKey: 'gathering',
  payload: {
    visible: { ...CONVERSATION, cardCount: 1 },
    introduced: ['card1'],
  },
}

export const deckGrows: Step<BeatPayload> = {
  id: 'the-deck-grows',
  section: 'the gathering',
  title: 'The deck grows',
  caption: 'Same shapes, new beats. Every answer extends the story without redrawing it.',
  Scene,
  groupKey: 'gathering',
  payload: {
    visible: { ...CONVERSATION, cardCount: 4 },
    introduced: ['card2', 'card3', 'card4', 'cardLink12', 'cardLink23', 'cardLink34'],
  },
}
