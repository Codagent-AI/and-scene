import { Box, SceneLayer, type SceneProps, type Step } from '../../../presentation-kit'
import { entities } from '../entities'
interface Payload { label: string; x: number }
function Diagram({ payload }: SceneProps<Payload>) {
  return <SceneLayer><Box id={entities.idea} style={{ position: 'absolute', left: payload.x, top: 140 }}>{payload.label}</Box></SceneLayer>
}
export const STEPS: Step<Payload>[] = [
  { id: 'start', era: 'the idea', title: 'Start with an idea', caption: 'One entity begins the story.', Scene: Diagram, groupKey: 'idea', payload: { label: 'An idea', x: 200 } },
  { id: 'develop', era: 'the idea', title: 'Let it develop', caption: 'The same entity moves as the story develops.', Scene: Diagram, groupKey: 'idea', payload: { label: 'A developed idea', x: 500 } },
]
