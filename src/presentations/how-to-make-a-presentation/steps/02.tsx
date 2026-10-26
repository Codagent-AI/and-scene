import type { Step } from '../../../presentation-kit'
import { ConversationScene } from './Scene'
import type { Beat } from './Scene'

export const step: Step<Beat> = {
  "id": "beat-2",
  "era": "the ask",
  "title": "The skill interviews you",
  "caption": "One question at a time: the topic, the look, then each beat of the story.",
  "groupKey": "conversation",
  "payload": {
    "beat": 2
  }
,
  Scene: ConversationScene,
}
