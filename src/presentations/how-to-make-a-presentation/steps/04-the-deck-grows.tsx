import type { Step } from '../../../presentation-kit'
import { Scene, type ScenePayload } from './scene'

export const theDeckGrows: Step<ScenePayload> = {
  id: 'the-deck-grows',
  era: 'the gathering',
  title: 'The deck grows',
  caption: 'Same shapes, new beats. Every answer extends the story without redrawing it.',
  groupKey: 'evolving-scene',
  Scene,
  payload: {
    showPrompt: true,
    showSkill: true,
    showQuestionChip: true,
    cardCount: 3,
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
