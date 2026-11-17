import { Presentation } from '../../presentation-kit'
import type { Step, SceneProps } from '../../presentation-kit'
function Scene({ payload }: SceneProps<string>) { return <div>{payload}</div> }
const steps: Step<string>[] = [{ id: 'start', era: 'example', title: 'Example', caption: 'Replace this example with your presentation.', Scene, payload: 'Your scene goes here' }]
export default function Talk() { return <Presentation steps={steps} title="Example" /> }
