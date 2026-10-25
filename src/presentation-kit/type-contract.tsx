// Compile-only fixture: generic payload is inferred through the public boundary.
import { Presentation } from './Presentation'
import type { SceneProps, Step } from './types'
interface Payload { label: string; count: number }
function Diagram({ payload }: SceneProps<Payload>) { return <span>{payload.label} {payload.count}</span> }
const steps: Step<Payload>[] = [{ id: 'typed', era: 'typed', title: 'Typed', caption: 'Typed payload', Scene: Diagram, groupKey: 'typed', payload: { label: 'safe', count: 1 } }]
export const typedPresentation = <Presentation title="Type contract" steps={steps} />
// @ts-expect-error incompatible payload must be rejected
export const invalidStep: Step<Payload> = { ...steps[0], payload: { label: 'bad', count: 'not a number' } }
