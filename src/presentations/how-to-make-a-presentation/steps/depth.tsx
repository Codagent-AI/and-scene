/**
 * Step 5 ("the gathering"): the viewer's own depth control. Its own Scene
 * mount — everything from earlier beats renders plainly (carried over via
 * shared `layoutId`s), only the ghost card and depth control are new here.
 */
import type { Step } from '../../../presentation-kit/types'
import { Scene, type BeatPayload } from './Scene'

export const youSetTheDepth: Step<BeatPayload> = {
  id: 'you-set-the-depth',
  section: 'the gathering',
  title: 'You set the depth',
  caption: 'Spell out every step, or sketch a few and see how it looks. You hold the gate.',
  Scene,
  groupKey: 'depth',
  payload: {
    visible: {
      you: true,
      prompt: true,
      skill: true,
      link: true,
      cardCount: 4,
      ghost: true,
      depthControl: true,
      kitSocket: false,
      verifyNode: false,
      verifyPass: false,
      modifyArc: false,
      editedCardIndex: null,
      revealFrame: false,
    },
    introduced: ['ghost', 'ghostLink', 'depthControl'],
  },
}
