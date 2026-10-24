import type { Step } from '../../../presentation-kit'
import { Scene, type ScenePayload } from './Scene'

const GROUP = '__SLUG__'

/** Ordered steps. Step numbers are derived from position, so reorder freely. */
export const STEPS: Step<ScenePayload>[] = [
  {
    id: 'topic',
    era: 'start',
    title: 'The topic',
    caption: 'Where the story begins.',
    groupKey: GROUP,
    Scene,
    payload: { n: 1 },
  },
  {
    id: 'detail',
    era: 'start',
    title: 'A connected detail',
    caption: 'The first entity stays put; a new one arrives and connects to it.',
    groupKey: GROUP,
    Scene,
    payload: { n: 2 },
  },
  {
    id: 'summary',
    era: 'finish',
    title: 'The whole story',
    caption: 'Everything accumulates in the same scene; nothing is redrawn.',
    groupKey: GROUP,
    Scene,
    payload: { n: 3 },
  },
]
