import { Presentation, Box, SceneLayer } from '../../presentation-kit'
import type { SceneProps, Step } from '../../presentation-kit'
function Scene({ payload }: SceneProps<string>) { return <SceneLayer><Box id="example:subject" style={{ position: 'absolute', left: 100, top: 100 }}>{payload}</Box></SceneLayer> }
const steps: Step<string>[] = [
  { id: 'start', era: 'example', title: 'An idea', caption: 'Begin with a topic.', Scene, payload: 'An idea', groupKey: 'example' },
  { id: 'next', era: 'example', title: 'An evolving scene', caption: 'The same entity continues.', Scene, payload: 'An evolving scene', groupKey: 'example' },
]
export default function Talk() { return <Presentation title="Example presentation" steps={steps} /> }
