import { Presentation } from '../../presentation-kit/Presentation'
import type { Step, SceneProps } from '../../presentation-kit/types'
import { Box } from '../../presentation-kit/nodes/Box'
function Scene({ payload }: SceneProps<string>) { return <Box id="starter:topic">{payload}</Box> }
const steps: Step<string>[] = [{ id: 'start', era: 'start', title: 'Your topic', caption: 'Replace this starter with your evolving scene.', Scene, payload: 'Your topic' }]
export default function Talk() { return <Presentation steps={steps} title="Starter presentation" /> }
