import type { Step, SceneProps } from '../../../presentation-kit/types'
import { Box } from '../../../presentation-kit/nodes/Box'
import { SceneLayer } from '../../../presentation-kit/nodes/SceneLayer'
import { entities } from '../entities'
interface Payload { label: string; x: number }
function Scene({ payload }: SceneProps<Payload>) {
  return <SceneLayer><Box id={entities.topic} style={{ position: 'absolute', left: payload.x, top: 120 }}>{payload.label}</Box></SceneLayer>
}
export const STEPS: Step<Payload>[] = [
  { id: 'ask', era: 'the idea', title: 'Start with an idea', caption: 'Explain the starting point.', groupKey: 'topic', Scene, payload: { label: 'Your topic', x: 100 } },
  { id: 'connect', era: 'the idea', title: 'Develop the idea', caption: 'Explain what changes and why.', groupKey: 'topic', Scene, payload: { label: 'A clearer idea', x: 380 } },
]
