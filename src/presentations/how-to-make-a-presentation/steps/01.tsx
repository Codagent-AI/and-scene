import type { Step } from '../../../presentation-kit'
import { ConversationScene } from './Scene'
import type { Beat } from './Scene'

export const step: Step<Beat> = {
  "id": "beat-1",
  "era": "the ask",
  "title": "You have a topic",
  "caption": "It starts with you, a topic, and mild overconfidence.",
  "groupKey": "conversation",
  "payload": {
    "beat": 1
  }
,
  Scene: ConversationScene,
}
