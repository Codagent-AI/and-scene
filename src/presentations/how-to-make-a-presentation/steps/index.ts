import type { Step } from '../../../presentation-kit'
import outline from '../outline.json'
import { Scene } from './Scene'
export const STEPS: Step<{ beat: number }>[] = outline.map((meta, i) => ({ ...meta, Scene, groupKey: 'conversation', payload: { beat: i + 1 } }))
