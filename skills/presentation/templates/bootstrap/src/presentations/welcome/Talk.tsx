import { Presentation, Box } from '../../presentation-kit'
import type { Step, SceneProps } from '../../presentation-kit'
function Scene({ payload }: SceneProps<string>) { return <Box layoutId="welcome:idea">{payload}</Box> }
const steps: Step<string>[] = [{ id: 'welcome', era: 'start', title: 'Your first scene', caption: 'Add your own presentation and local CSS.', Scene, payload: 'One idea, ready to grow.' }]
export default function Talk() { return <Presentation steps={steps} title="Welcome" /> }
