/**
 * Step 8 ("the loop"): a modify arc reaches from the conversation down into
 * the tray route, flagging the edited card. Own Scene mount — everything
 * from earlier beats carries over plainly via shared `layoutId`s.
 */
import type { Step } from '../../../presentation-kit/types'
import { Scene, NONE_VISIBLE, type BeatPayload } from './Scene'

export const changedYourMindLoopIt: Step<BeatPayload> = {
  id: 'loop-it',
  section: 'the loop',
  title: 'Changed your mind? Loop it.',
  caption: 'Point at a step and ask. The skill edits the scene in place — nothing is redrawn from scratch.',
  Scene,
  groupKey: 'loop',
  payload: {
    visible: {
      ...NONE_VISIBLE,
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
    },
    introduced: ['modifyArc', 'modifyLabel', 'editedFlag'],
  },
}
