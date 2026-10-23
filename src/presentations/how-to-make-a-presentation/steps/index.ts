import type { Step } from '../../../presentation-kit'
import { OUTLINE } from '../outline'
import { TalkScene, type TalkPayload } from '../TalkScene'

// One evolving scene: every step shares the group and Scene, so only the payload changes.
export const STEPS: Step<TalkPayload>[] = OUTLINE.map((beat, i) => ({
  id: beat.id,
  era: beat.era,
  title: beat.title,
  caption: beat.caption,
  groupKey: 'story',
  Scene: TalkScene,
  payload: { n: i + 1 },
}))
