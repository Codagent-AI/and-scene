import type { Step } from '../../../presentation-kit'
import { Scene, type ScenePayload } from './scene'

export const youHaveATopic: Step<ScenePayload> = {
  id: 'you-have-a-topic',
  era: 'the ask',
  title: 'You have a topic',
  caption: 'It starts with you, a topic, and mild overconfidence.',
  groupKey: 'evolving-scene',
  Scene,
  payload: {
    showPrompt: true,
    showSkill: false,
    showQuestionChip: false,
    cardCount: 0,
    showGhostCard: false,
    showPartialControl: false,
    showKitSocket: false,
    showVerifyNode: false,
    verifyPassed: false,
    showModifyArc: false,
    editedCardFlagged: false,
    showRevealFrame: false,
  },
}
