import type { Step } from '../../../presentation-kit'
import { Scene } from './Scene'
import type { Payload } from './payload'
import { GROUP_KEY } from './01-the-ask'

export const step05: Step<Payload> = {
  id: 'htmap-05',
  era: 'the gathering',
  title: 'You set the depth',
  caption: 'Spell out every step, or sketch a few and see how it looks. You hold the gate.',
  payload: {
    showConversation: true,
    showSkillNode: true,
    showQuestionChip: true,
    cards: [
      { id: 'htmap-card-0', label: 'title · caption · visual' },
      { id: 'htmap-card-1', label: 'title · caption · visual' },
      { id: 'htmap-card-2', label: 'title · caption · visual' },
      { id: 'htmap-card-3', label: '…', ghost: true },
    ],
    showDepthControl: true,
    showSceneKit: false,
    showVerify: false,
    verifyPassed: false,
    showModifyArc: false,
    showReveal: false,
  },
  Scene,
  groupKey: GROUP_KEY,
}
