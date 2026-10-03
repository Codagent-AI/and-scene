import type { Step } from '../../../presentation-kit'
import { Scene, type ScenePayload } from './scene'

export const youSetTheDepth: Step<ScenePayload> = {
  id: 'you-set-the-depth',
  era: 'the gathering',
  title: 'You set the depth',
  caption: 'Spell out every step, or sketch a few and see how it looks. You hold the gate.',
  groupKey: 'evolving-scene',
  Scene,
  payload: {
    showPrompt: true,
    showSkill: true,
    showQuestionChip: true,
    cardCount: 3,
    showGhostCard: true,
    showPartialControl: true,
    showKitSocket: false,
    showVerifyNode: false,
    verifyPassed: false,
    showModifyArc: false,
    editedCardFlagged: false,
    showRevealFrame: false,
  },
}
