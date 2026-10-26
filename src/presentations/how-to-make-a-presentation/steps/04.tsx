import type { Step } from '../../../presentation-kit'
import { ConversationScene } from './Scene'
import type { Beat } from './Scene'

export const step: Step<Beat> = {
  "id": "beat-4",
  "era": "the gathering",
  "title": "The deck grows",
  "caption": "Same shapes, new beats. Every answer extends the story without redrawing it.",
  "groupKey": "conversation",
  "payload": {
    "beat": 4
  }
,
  Scene: ConversationScene,
}
