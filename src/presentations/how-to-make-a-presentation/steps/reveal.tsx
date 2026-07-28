/**
 * Step 9 ("the reveal"): an outer frame draws around the whole diagram,
 * labeled — the self-reference reveal. Own Scene mount — every earlier
 * entity carries over plainly via shared `layoutId`s.
 */
import type { Step } from '../../../presentation-kit/types'
import { Scene, type BeatPayload } from './Scene'

export const youreLookingAtOne: Step<BeatPayload> = {
  id: 'youre-looking-at-one',
  section: 'the reveal',
  title: "You're looking at one",
  caption: 'This presentation was built exactly this way. Thanks for watching.',
  Scene,
  groupKey: 'reveal',
  payload: {
    visible: {
      you: true,
      prompt: true,
      skill: true,
      link: true,
      cardCount: 4,
      ghost: true,
      depthControl: true,
      kitSocket: true,
      verifyNode: true,
      verifyPass: true,
      modifyArc: true,
      editedCardIndex: 1,
      revealFrame: true,
    },
    introduced: ['revealFrame', 'revealLabel'],
  },
}
