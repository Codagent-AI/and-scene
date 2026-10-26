import { Presentation } from '../src/presentation-kit/Presentation'
import type { SceneProps, Step } from '../src/presentation-kit/types'
function Typed({ payload }: SceneProps<{ count: number }>) { return <p>{payload.count}</p> }
const steps: Step<{ count: number }>[] = [{ id: 'one', era: 'test', title: 'Title', caption: 'Caption', groupKey: 'typed', Scene: Typed, payload: { count: 1 } }]
export const valid = <Presentation steps={steps} title="Typed" />
// @ts-expect-error Incorrect payload must not be accepted at the presentation boundary.
export const invalid = <Presentation<{ count: string }> steps={steps} title="Wrong" />
