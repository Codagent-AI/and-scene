import type { Step } from '../../../presentation-kit'
import { ConversationScene } from './Scene'
import type { Beat } from './Scene'

export const step: Step<Beat> = {
  "id": "beat-3",
  "era": "the gathering",
  "title": "Answers become steps",
  "caption": "Each answer lands as a step card — title, caption, visual — plus what morphs from one step into the next.",
  "groupKey": "conversation",
  "payload": {
    "beat": 3
  }
,
  Scene: ConversationScene,
}
