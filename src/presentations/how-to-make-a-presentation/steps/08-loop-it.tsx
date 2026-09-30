import type { Step } from '../../../presentation-kit'
import { Scene } from './Scene'
import type { Payload } from './payload'
import { GROUP_KEY } from './01-the-ask'

export const step08: Step<Payload> = {
  id: 'htmap-08',
  era: 'the loop',
  title: 'Changed your mind? Loop it.',
  caption:
    "Point at a step and ask. The skill edits the scene in place — nothing is redrawn from scratch.",
  payload: {
    showConversation: true,
    showSkillNode: true,
    showQuestionChip: true,
    cards: [
      { id: 'htmap-card-0', label: 'title · caption · visual' },
      { id: 'htmap-card-1', label: 'title · caption · visual', flagged: true },
      { id: 'htmap-card-2', label: 'title · caption · visual' },
      { id: 'htmap-card-3', label: '…', ghost: true },
    ],
    showDepthControl: true,
    showSceneKit: true,
    showVerify: true,
    verifyPassed: true,
    showModifyArc: true,
    showReveal: false,
  },
  Scene,
  groupKey: GROUP_KEY,
}
