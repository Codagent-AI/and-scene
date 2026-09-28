import type { Step } from '../../../presentation-kit'
import { Scene, type ScenePayload } from './scene'

export const itChecksItsOwnWork: Step<ScenePayload> = {
  id: 'it-checks-its-own-work',
  era: 'the build',
  title: 'It checks its own work',
  caption: 'Before saying done, it builds and renders every step — and fixes what breaks.',
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
    showModifyArc: false,
    editedCardFlagged: false,
    showRevealFrame: false,
  },
}
