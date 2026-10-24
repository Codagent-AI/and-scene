import type { Step } from '../../../presentation-kit'
import outline from '../outline.json'
import { WorkshopScene } from './Scene'
export const STEPS: readonly Step<number>[] = outline.map((meta, i) => ({ ...meta, Scene: WorkshopScene, groupKey: 'workshop', payload: i + 1 }))
