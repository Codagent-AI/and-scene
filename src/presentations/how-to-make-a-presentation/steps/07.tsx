import type { Step } from '../../../presentation-kit'
import { ConversationScene } from './Scene'
import type { Beat } from './Scene'

export const step: Step<Beat> = {
  "id": "beat-7",
  "era": "the build",
  "title": "It checks its own work",
  "caption": "Before saying done, it builds and renders every step — and fixes what breaks.",
  "groupKey": "conversation",
  "payload": {
    "beat": 7
  }
,
  Scene: ConversationScene,
}
