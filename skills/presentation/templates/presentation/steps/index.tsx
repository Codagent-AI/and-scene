import { Box, SceneLayer } from '../../../presentation-kit'
import type { SceneProps, Step } from '../../../presentation-kit'
import { entities } from '../entities'
interface Payload { label: string; x: number }
function Diagram({ payload }: SceneProps<Payload>) {
  return <SceneLayer><Box entityId={entities.idea} style={{ position: 'absolute', left: payload.x, top: 120 }}>{payload.label}</Box></SceneLayer>
}
export const STEPS: Step<Payload>[] = [
  { id: 'begin', era: 'the idea', title: 'Replace with the first beat', caption: 'Replace with a paragraph for self-guided reading.', groupKey: 'idea', Scene: Diagram, payload: { label: 'Idea', x: 200 } },
  { id: 'develop', era: 'the idea', title: 'Replace with the next beat', caption: 'Explain what changes and why.', groupKey: 'idea', Scene: Diagram, payload: { label: 'Developed idea', x: 400 } },
]
