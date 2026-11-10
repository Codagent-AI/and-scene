import type { Step } from '../../../presentation-kit'
import { Scene } from './Scene'
export const STEPS: Step<number>[] = [
  { id: 'opening', era: 'the idea', title: '__TITLE__', caption: 'Introduce the idea and its context.', groupKey: 'idea', Scene, payload: 1 },
  { id: 'connection', era: 'the idea', title: 'Make the connection', caption: 'Build on the same diagram with a new connection.', groupKey: 'idea', Scene, payload: 2 },
]
