import type { Step } from '../../presentation-kit'
import { StarterScene, type StarterPayload } from './StarterScene'

const beats = [
  { id: 'idea', era: 'start', title: 'An idea', caption: 'Every presentation starts with one idea.' },
  { id: 'scene', era: 'start', title: 'One scene', caption: 'The idea becomes a scene that evolves.' },
  { id: 'steps', era: 'next', title: 'Many steps', caption: 'Each step changes the same scene.' },
]

export const STEPS: Step<StarterPayload>[] = beats.map((beat, i) => ({
  ...beat,
  Scene: StarterScene,
  payload: { step: i + 1 },
  groupKey: 'starter',
}))
