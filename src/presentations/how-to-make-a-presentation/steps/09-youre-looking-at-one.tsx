import type { Step } from '../../../presentation-kit'
import { Scene, type ScenePayload } from './scene'

export const youreLookingAtOne: Step<ScenePayload> = {
  id: 'youre-looking-at-one',
  era: 'the reveal',
  title: "You're looking at one",
  caption: 'This presentation was built exactly this way. Thanks for watching.',
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
    showRevealFrame: true,
  },
}
