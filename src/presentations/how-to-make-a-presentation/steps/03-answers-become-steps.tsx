import type { Step } from '../../../presentation-kit'
import { Scene, type ScenePayload } from './scene'

export const answersBecomeSteps: Step<ScenePayload> = {
  id: 'answers-become-steps',
  era: 'the gathering',
  title: 'Answers become steps',
  caption:
    'Each answer lands as a step card — title, caption, visual — plus what morphs from one step into the next.',
  groupKey: 'evolving-scene',
  Scene,
  payload: {
    showPrompt: true,
    showSkill: true,
    showQuestionChip: true,
    cardCount: 1,
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
