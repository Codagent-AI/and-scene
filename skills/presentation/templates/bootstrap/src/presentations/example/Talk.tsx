import { Presentation, Box, type SceneProps, type Step } from '../../presentation-kit'
function Scene({ payload }: SceneProps<string>) { return <Box entityId="example:anchor" style={{ position: 'absolute', left: 100, top: 100 }}>{payload}</Box> }
const steps: Step<string>[] = [{ id: 'start', era: 'example', title: 'Start', caption: 'A neutral bootstrap fixture.', groupKey: 'example', Scene, payload: 'One scene' }, { id: 'next', era: 'example', title: 'Continue', caption: 'The same scene, updated.', groupKey: 'example', Scene, payload: 'Another state' }]
export default function Talk() { return <Presentation steps={steps} title="Example" /> }
