import type { Step } from '../../../presentation-kit'
import { SceneLayer, Label } from '../../../presentation-kit'

export const steps: Step[] = [
  {
    id: 'first-beat',
    era: 'beginning',
    title: 'First beat',
    caption: 'A concise sentence that explains what changes in this scene.',
    scene: () => (
      <SceneLayer className="example-scene">
        <Label id="example-topic" x={80} y={90}>Your topic</Label>
      </SceneLayer>
    ),
    payload: undefined,
  },
]
