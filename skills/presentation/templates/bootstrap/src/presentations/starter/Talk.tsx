import { Presentation, SceneLayer, Box, type SceneProps, type Step } from '../../presentation-kit'
import './starter.css'
type Payload = { label: string }
function Scene({ payload }: SceneProps<Payload>) { return <SceneLayer><Box className="starter-node" entityId="starter:subject" style={{ position: 'absolute', left: 320, top: 140 }}>{payload.label}</Box></SceneLayer> }
const steps: readonly Step<Payload>[] = [{ id: 'starter', era: 'Start', title: 'Starter scene', caption: 'A neutral starting point for a generated presentation.', payload: { label: 'Start here' }, Scene, groupKey: 'starter' }]
export default function Talk() { return <Presentation steps={steps} title="Starter presentation" /> }
