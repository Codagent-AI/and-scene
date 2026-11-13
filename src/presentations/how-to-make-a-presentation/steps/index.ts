import type { Step } from '../../../presentation-kit/types'
import { sampleMeta } from '../entities'
import Story from './Story'
export const STEPS:Step<number>[] = sampleMeta.map((s,i)=>({...s,Scene:Story,groupKey:'story',payload:i}))
