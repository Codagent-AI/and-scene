import type { Step } from '../../../presentation-kit'
import { Scene } from './Scene'
import type { Payload } from './payload'

export const GROUP_KEY = 'htmap-scene'

export const step01: Step<Payload> = {
  id: 'htmap-01',
  era: 'the ask',
  title: 'You have a topic',
  caption: 'It starts with you, a topic, and mild overconfidence.',
  payload: {
    showConversation: true,
    showSkillNode: false,
    showQuestionChip: false,
    cards: [],
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
