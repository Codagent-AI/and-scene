import { Presentation } from '../../presentation-kit/Presentation'
import { Box } from '../../presentation-kit/nodes/Box'
import type { Step } from '../../presentation-kit/types'
function StarterScene() { return <Box layoutId="starter-node">Add your scene</Box> }
const steps: Step[] = [{ id: 'start', era: 'Start', title: 'Your first step', caption: 'Describe the idea this scene introduces.', Scene: StarterScene, payload: undefined }]
export default function Talk() { return <Presentation steps={steps} title="Your presentation" /> }
