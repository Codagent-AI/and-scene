import { Presentation, Box, SceneLayer } from '../../presentation-kit'
import type { SceneProps, Step } from '../../presentation-kit'
function Scene({ payload }: SceneProps<string>) { return <SceneLayer><Box entityId="starter:idea" style={{ position: 'absolute', left: 100, top: 150 }}>{payload}</Box></SceneLayer> }
const steps: Step<string>[] = [{ id: 'start', era: 'begin', title: 'A first scene', caption: 'Add your own presentation and visual style.', groupKey: 'starter', Scene, payload: 'Your idea' }]
export default function Talk() { return <Presentation steps={steps} title="A first scene" /> }
