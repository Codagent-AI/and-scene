import type { Step } from '../../../presentation-kit'
import { ConversationScene } from './Scene'
import type { Beat } from './Scene'

export const step: Step<Beat> = {
  "id": "beat-9",
  "era": "the reveal",
  "title": "You're looking at one",
  "caption": "This presentation was built exactly this way. Thanks for watching.",
  "groupKey": "conversation",
  "payload": {
    "beat": 9
  }
,
  Scene: ConversationScene,
}
