import { Box, SceneLayer, type SceneProps, type Step } from '../../presentation-kit'
import { entity } from './entities'
interface Payload { label: string; x: number }
function Scene({ payload }: SceneProps<Payload>) { return <SceneLayer><Box id={entity.idea} style={{ position: 'absolute', left: payload.x, top: 140 }}>{payload.label}</Box></SceneLayer> }
export const STEPS: Step<Payload>[] = [
  { id: 'begin', era: 'the idea', title: 'An idea', caption: 'Begin your explanation here.', groupKey: 'idea', Scene, payload: { label: 'idea', x: 80 } },
  { id: 'develop', era: 'the idea', title: 'An idea develops', caption: 'The same entity evolves.', groupKey: 'idea', Scene, payload: { label: 'developed idea', x: 420 } },
]
