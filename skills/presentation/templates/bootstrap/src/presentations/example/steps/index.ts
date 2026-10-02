import type { Step } from '../../../presentation-kit'
import { IntroScene } from './intro'

export const steps: Step<{ label: string }>[] = [
  { id: 'intro', section: 'Example', title: 'Start with a topic', caption: 'A presentation is one scene that evolves through steps.', scene: IntroScene, payload: { label: 'Your topic' } },
]
