import type { Step } from '../../../presentation-kit'
import { ConversationScene } from './Scene'
import type { Beat } from './Scene'

export const step: Step<Beat> = {
  "id": "beat-8",
  "era": "the loop",
  "title": "Changed your mind? Loop it.",
  "caption": "Point at a step and ask. The skill edits the scene in place — nothing is redrawn from scratch.",
  "groupKey": "conversation",
  "payload": {
    "beat": 8
  }
,
  Scene: ConversationScene,
}
