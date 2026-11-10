import { Presentation, Box, SceneLayer } from '../../presentation-kit'
import type { SceneProps, Step } from '../../presentation-kit'
function Scene({ payload }: SceneProps<string>) {
  return <SceneLayer><Box id="example:idea" style={{ position: 'absolute', left: 100, top: 100 }}>{payload}</Box></SceneLayer>
}
const steps: Step<string>[] = [
  { id: 'start', era: 'idea', title: 'An idea', caption: 'Begin with one stable entity.', groupKey: 'idea', Scene, payload: 'An idea' },
  { id: 'develop', era: 'idea', title: 'An evolving idea', caption: 'The same entity changes in place.', groupKey: 'idea', Scene, payload: 'An evolving idea' },
]
export default function Talk() { return <Presentation title="Example" steps={steps} /> }
