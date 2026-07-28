import type { Step } from '../../../presentation-kit'
import { Scene } from './Scene'
import type { Payload } from './payload'
import { GROUP_KEY } from './01-the-ask'

export const step06: Step<Payload> = {
  id: 'htmap-06',
  era: 'the build',
  title: 'It assembles the scene',
  caption:
    'Your steps are wired into one evolving scene, drawn with a shared scene kit — ready-made boxes, arrows, and motion that make entities morph.',
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
    showVerify: false,
    verifyPassed: false,
    showModifyArc: false,
    showReveal: false,
  },
  Scene,
  groupKey: GROUP_KEY,
}
