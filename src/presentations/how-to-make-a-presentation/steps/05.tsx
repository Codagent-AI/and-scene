import type { Step } from '../../../presentation-kit'
import { ConversationScene } from './Scene'
import type { Beat } from './Scene'

export const step: Step<Beat> = {
  "id": "beat-5",
  "era": "the gathering",
  "title": "You set the depth",
  "caption": "Spell out every step, or sketch a few and see how it looks. You hold the gate.",
  "groupKey": "conversation",
  "payload": {
    "beat": 5
  }
,
  Scene: ConversationScene,
}
