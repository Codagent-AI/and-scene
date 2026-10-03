import type { Step } from '../../presentation-kit'
import { SceneLayer } from '../../presentation-kit'

export const steps: Step[] = [
  {
    id: '{{slug}}-{{step-id}}',
    era: '{{section}}',
    title: '{{step title}}',
    caption: '{{step caption}}',
    payload: {},
    Scene: () => <SceneLayer className="{{slug}}-scene">{/* Compose this step's diagram here. */}</SceneLayer>,
  },
]
