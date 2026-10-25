import type { Step } from '../../../presentation-kit'
import outline from '../outline.json'
import { Scene } from './Scene'
export const STEPS: Step<number>[] = outline.map((meta, i) => ({ ...meta, Scene, payload: i + 1, groupKey: 'making-a-presentation' }))
