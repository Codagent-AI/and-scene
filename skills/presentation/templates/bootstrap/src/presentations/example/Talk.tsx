import { Presentation, Box } from '../../presentation-kit'
import type { Step } from '../../presentation-kit'
const steps: Step[] = [{ id: 'start', era: 'start', title: 'Your presentation', caption: 'Replace this example with your own evolving scene.', payload: undefined, Scene: () => <Box entityId="example:idea">Your idea</Box> }]
export default function Talk() { return <Presentation steps={steps} title="Example" /> }
