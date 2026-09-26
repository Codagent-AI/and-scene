import type { Step } from '../../presentation-kit/index.js'
import { SceneLayer, Label } from '../../presentation-kit/index.js'

export const steps: Step[] = [
  {
    id: 'first-beat',
    era: 'beginning',
    title: 'First beat',
    caption: 'A concise sentence that explains what changes in this scene.',
    scene: () => (
      <SceneLayer className="example-scene">
        <Label id="example-topic" style={{ position: 'absolute', left: 80, top: 90 }}>Your topic</Label>
      </SceneLayer>
    ),
    payload: undefined,
  },
]
