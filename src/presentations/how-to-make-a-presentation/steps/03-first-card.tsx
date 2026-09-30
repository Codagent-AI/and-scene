import type { Step } from '../../../presentation-kit'
import { Scene } from './Scene'
import type { Payload } from './payload'
import { GROUP_KEY } from './01-the-ask'

export const step03: Step<Payload> = {
  id: 'htmap-03',
  era: 'the gathering',
  title: 'Answers become steps',
  caption:
    'Each answer lands as a step card — title, caption, visual — plus what morphs from one step into the next.',
  payload: {
    showConversation: true,
    showSkillNode: true,
    showQuestionChip: true,
    cards: [{ id: 'htmap-card-0', label: 'title · caption · visual' }],
    showDepthControl: false,
    showSceneKit: false,
    showVerify: false,
    verifyPassed: false,
    showModifyArc: false,
    showReveal: false,
  },
  Scene,
  groupKey: GROUP_KEY,
}
