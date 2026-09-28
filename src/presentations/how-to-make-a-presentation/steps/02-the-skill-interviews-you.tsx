import type { Step } from '../../../presentation-kit'
import { Scene, type ScenePayload } from './scene'

export const theSkillInterviewsYou: Step<ScenePayload> = {
  id: 'the-skill-interviews-you',
  era: 'the ask',
  title: 'The skill interviews you',
  caption: 'One question at a time: the topic, the look, then each beat of the story.',
  groupKey: 'evolving-scene',
  Scene,
  payload: {
    showPrompt: true,
    showSkill: true,
    showQuestionChip: true,
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
