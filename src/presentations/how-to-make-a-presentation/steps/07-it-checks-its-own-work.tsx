import type { Step } from '../../../presentation-kit'
import { Scene } from './Scene'
import type { Payload } from './payload'
import { GROUP_KEY } from './01-the-ask'

export const step07: Step<Payload> = {
  id: 'htmap-07',
  era: 'the build',
  title: 'It checks its own work',
  caption: 'Before saying done, it builds and renders every step — and fixes what breaks.',
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
    showSceneKit: true,
    showVerify: true,
    verifyPassed: true,
    showModifyArc: false,
    showReveal: false,
  },
  Scene,
  groupKey: GROUP_KEY,
}
