import type { Step } from '../../../presentation-kit'
import { Scene } from './Scene'
import type { Payload } from './payload'
import { GROUP_KEY } from './01-the-ask'

export const step04: Step<Payload> = {
  id: 'htmap-04',
  era: 'the gathering',
  title: 'The deck grows',
  caption: 'Same shapes, new beats. Every answer extends the story without redrawing it.',
  payload: {
    showConversation: true,
    showSkillNode: true,
    showQuestionChip: true,
    cards: [
      { id: 'htmap-card-0', label: 'title · caption · visual' },
      { id: 'htmap-card-1', label: 'title · caption · visual' },
      { id: 'htmap-card-2', label: 'title · caption · visual' },
    ],
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
