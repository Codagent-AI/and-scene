import { defineStep } from '../../presentation-kit/index.ts'
import { Scene } from './Scene.tsx'

/** Ordered steps; each one's on-screen number comes from its position. */
export const STEPS = [
  defineStep({
    id: 'step-1',
    era: 'start',
    title: 'Name the idea',
    caption: 'Every presentation starts as one idea on one canvas.',
    Scene,
    groupKey: 'scene',
    payload: { beat: 1 },
  }),
  defineStep({
    id: 'step-2',
    era: 'start',
    title: 'Let it grow',
    caption: 'Each step changes the same scene instead of replacing it.',
    Scene,
    groupKey: 'scene',
    payload: { beat: 2 },
  }),
  defineStep({
    id: 'step-3',
    era: 'finish',
    title: 'Make it yours',
    caption: 'Replace this starter with a presentation about your topic.',
    Scene,
    groupKey: 'scene',
    payload: { beat: 3 },
  }),
]
