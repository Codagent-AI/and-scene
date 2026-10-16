import { defineStep } from '../../presentation-kit/index.ts'
import { Scene } from './Scene.tsx'

/** Ordered steps; each one's on-screen number comes from its position. */
export const STEPS = [
  defineStep({
    id: 'step-1',
    era: '{{era1}}',
    title: '{{title1}}',
    caption: '{{caption1}}',
    Scene,
    groupKey: 'scene',
    payload: { beat: 1 },
  }),
  defineStep({
    id: 'step-2',
    era: '{{era2}}',
    title: '{{title2}}',
    caption: '{{caption2}}',
    Scene,
    groupKey: 'scene',
    payload: { beat: 2 },
  }),
  defineStep({
    id: 'step-3',
    era: '{{era3}}',
    title: '{{title3}}',
    caption: '{{caption3}}',
    Scene,
    groupKey: 'scene',
    payload: { beat: 3 },
  }),
]
