import { Presentation } from '../../presentation-kit/Presentation'
import { Box } from '../../presentation-kit/nodes/Box'
import type { Step } from '../../presentation-kit/types'
function ExampleScene() { return <Box layoutId="example-node">Example scene</Box> }
const steps: Step[] = [{ id: 'start', era: 'Example', title: 'A scene begins', caption: 'This starter entry demonstrates the presentation route.', Scene: ExampleScene, payload: undefined }]
export default function Talk() { return <Presentation steps={steps} title="Example" /> }
