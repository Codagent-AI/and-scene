import type { Step } from '../../presentation-kit'
import { Scene, type Payload } from './Scene'

// Steps sharing a groupKey and Scene keep one mounted scene; only the payload changes between them.
export const STEPS: Step<Payload>[] = [
  { id: 'start', era: 'intro', title: '__TITLE__', caption: 'Where the story begins.', groupKey: 'story', Scene, payload: { n: 1 } },
  { id: 'next', era: 'intro', title: 'The next idea', caption: 'A new entity enters while the first one stays put.', groupKey: 'story', Scene, payload: { n: 2 } },
]
