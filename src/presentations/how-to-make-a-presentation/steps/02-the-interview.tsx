import type { Step } from '../../../presentation-kit'
import { Scene } from './Scene'
import type { Payload } from './payload'
import { GROUP_KEY } from './01-the-ask'

export const step02: Step<Payload> = {
  id: 'htmap-02',
  era: 'the ask',
  title: 'The skill interviews you',
  caption: 'One question at a time: the topic, the look, then each beat of the story.',
  payload: {
    showConversation: true,
    showSkillNode: true,
    showQuestionChip: true,
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
