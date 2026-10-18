import type { Step } from '../../presentation-kit'
import { Scene, type ScenePayload } from './Scene'

const TABLE = [
  ['start', 'The subject', 'Introduce the thing this presentation is about.'],
  ['start', 'A detail appears', 'A second entity joins; the first stays where it is.'],
  ['finish', 'They connect', 'A link shows how the two relate, without redrawing either.'],
] as const

/** Steps sharing a `groupKey` and `Scene` keep one mounted scene: only the payload changes. */
export const STEPS: Step<ScenePayload>[] = TABLE.map(([era, title, caption], i) => ({
  id: `step-${i + 1}`,
  era,
  title,
  caption,
  groupKey: 'scene',
  Scene,
  payload: { stage: i },
}))
