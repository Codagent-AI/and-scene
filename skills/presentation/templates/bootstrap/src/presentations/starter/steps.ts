import type { Step } from '../../presentation-kit/index.ts'
import { MainScene } from './Scene.tsx'

export interface Payload {
  /** 1-based beat; entities are revealed from the beat that introduces them onward. */
  beat: number
}

/** One scene, many steps: grouped steps update the mounted scene in place so entities morph. */
export const STEPS: Step<Payload>[] = [
  {
    id: 'start',
    era: 'start',
    title: 'Start with one idea',
    caption: 'Replace this caption with the paragraph a reader sees in browse mode.',
    Scene: MainScene,
    groupKey: 'main',
    payload: { beat: 1 },
  },
  {
    id: 'connect',
    era: 'start',
    title: 'Connect it to another',
    caption: 'Entities that are already on screen stay put; only new ones enter.',
    Scene: MainScene,
    groupKey: 'main',
    payload: { beat: 2 },
  },
  {
    id: 'land',
    era: 'finish',
    title: 'Land the point',
    caption: 'Each step is one named state of the same evolving diagram.',
    Scene: MainScene,
    groupKey: 'main',
    payload: { beat: 3 },
  },
]
