import type { Step } from '../../../presentation-kit'
import { Scene, type ScenePayload } from './scene'

export const changedYourMindLoopIt: Step<ScenePayload> = {
  id: 'changed-your-mind-loop-it',
  era: 'the loop',
  title: 'Changed your mind? Loop it.',
  caption: 'Point at a step and ask. The skill edits the scene in place — nothing is redrawn from scratch.',
  groupKey: 'evolving-scene',
  Scene,
  payload: {
    showPrompt: true,
    showSkill: true,
    showQuestionChip: true,
    cardCount: 3,
    showGhostCard: true,
    showPartialControl: true,
    showKitSocket: true,
    showVerifyNode: true,
    verifyPassed: true,
    showModifyArc: true,
    editedCardFlagged: true,
    showRevealFrame: false,
  },
}
