import type { Step } from '../../../presentation-kit'
import outline from '../outline.json'
import { Scene } from './Scene'
export const STEPS: Step<number>[] = outline.map((meta, index) => ({...meta,groupKey:'the-conversation',Scene,payload:index+1}))
