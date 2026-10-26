import type { Step } from '../../../presentation-kit'
import { Scene } from './Scene'
import type { Payload } from './payload'
import { GROUP_KEY } from './01-the-ask'

export const step09: Step<Payload> = {
  id: 'htmap-09',
  era: 'the reveal',
  title: "You're looking at one",
  caption: 'This presentation was built exactly this way. Thanks for watching.',
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
    showReveal: true,
  },
  Scene,
  groupKey: GROUP_KEY,
}
