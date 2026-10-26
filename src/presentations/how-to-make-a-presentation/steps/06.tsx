import type { Step } from '../../../presentation-kit'
import { ConversationScene } from './Scene'
import type { Beat } from './Scene'

export const step: Step<Beat> = {
  "id": "beat-6",
  "era": "the build",
  "title": "It assembles the scene",
  "caption": "Your steps are wired into one evolving scene, drawn with a shared scene kit — ready-made boxes, arrows, and motion that make entities morph.",
  "groupKey": "conversation",
  "payload": {
    "beat": 6
  }
,
  Scene: ConversationScene,
}
