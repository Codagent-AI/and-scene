import type { Step } from '../../../presentation-kit'
import { Scene, type ScenePayload } from './scene'

type Meta = [id: string, era: string, title: string, caption: string]

const META: readonly Meta[] = [
  ['start', 'intro', 'Where we begin', 'The first beat of the story.'],
  ['next', 'intro', 'What comes next', 'The scene evolves; nothing is redrawn.'],
]

/** Steps sharing a groupKey and Scene keep one mounted scene; only the payload changes. */
export const STEPS: readonly Step<ScenePayload>[] = META.map(([id, era, title, caption], i) => ({
  id,
  era,
  title,
  caption,
  Scene,
  payload: { n: i + 1 },
  groupKey: 'main',
}))
