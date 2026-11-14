import { Presentation } from '../../src/presentation-kit/Presentation'
import type { Step, SceneProps } from '../../src/presentation-kit/types'
function Diagram({ payload }: SceneProps<{ count: number }>) { return <div>{payload.count}</div> }
const steps: Step<{ count: number }>[] = [{ id: 'one', era: 'start', title: 'One', caption: 'One item.', Scene: Diagram, groupKey: 'same', payload: { count: 1 } }]
export const valid = <Presentation title="Typed" steps={steps} />
// @ts-expect-error Wrong payload must be rejected at the presentation boundary.
export const invalid = <Presentation<string> title="Wrong" steps={steps} />
