import type { Step } from '../../../presentation-kit'
import { Scene, type ScenePayload } from './scene'

export const itAssemblesTheScene: Step<ScenePayload> = {
  id: 'it-assembles-the-scene',
  era: 'the build',
  title: 'It assembles the scene',
  caption:
    'Your steps are wired into one evolving scene, drawn with a shared scene kit — ready-made boxes, arrows, and motion that make entities morph.',
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
    showVerifyNode: false,
    verifyPassed: false,
    showModifyArc: false,
    editedCardFlagged: false,
    showRevealFrame: false,
  },
}
