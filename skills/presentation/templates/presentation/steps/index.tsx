import type { Step } from '../../../presentation-kit/types'

export const steps: Step[] = [
  {
    id: 'opening',
    era: 'Opening',
    title: 'Opening',
    caption: 'State the first useful idea in one concise sentence.',
    payload: null,
    scene: () => <div data-scene="opening">Replace this scene with a composed diagram.</div>,
  },
]
