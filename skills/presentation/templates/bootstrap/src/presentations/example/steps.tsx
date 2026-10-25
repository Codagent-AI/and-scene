import { Box, SceneLayer } from '../../presentation-kit'
import type { SceneProps, Step } from '../../presentation-kit'
import { entities } from './entities'
interface Payload { label: string; x: number }
function Scene({ payload }: SceneProps<Payload>) {
  return <SceneLayer><Box identity={entities.idea} style={{ position: 'absolute', left: payload.x, top: 100 }}>{payload.label}</Box></SceneLayer>
}
export const STEPS: readonly Step<Payload>[] = [
  { id: 'idea', era: 'the idea', title: 'Your first beat', caption: 'Replace this with a paragraph explaining the diagram.', groupKey: 'idea', Scene, payload: { label: 'An idea', x: 100 } },
  { id: 'change', era: 'the change', title: 'An idea develops', caption: 'The same entity moves as the story develops.', groupKey: 'idea', Scene, payload: { label: 'An evolving idea', x: 400 } },
]
