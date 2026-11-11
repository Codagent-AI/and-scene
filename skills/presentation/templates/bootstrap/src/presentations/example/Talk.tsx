import { Presentation } from '../../presentation-kit/Presentation'
import { Box } from '../../presentation-kit/nodes/Box'
import type { SceneProps, Step } from '../../presentation-kit/types'
function Scene({ payload }: SceneProps<string>) { return <Box id="example:subject">{payload}</Box> }
const steps: Step<string>[] = [
  { id: 'start', era: 'example', title: 'Start here', caption: 'Replace this example with your story.', Scene, payload: 'A subject', groupKey: 'example' },
  { id: 'next', era: 'example', title: 'Develop the idea', caption: 'Keep the same entity as its meaning evolves.', Scene, payload: 'The same subject, evolved', groupKey: 'example' },
]
export default function Talk() { return <Presentation steps={steps} title="Example presentation" /> }
