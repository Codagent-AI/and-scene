import { Presentation } from '../src/presentation-kit/Presentation'
import type { SceneProps, Step } from '../src/presentation-kit/types'
function Scene({ payload }: SceneProps<{ count: number }>) { return <div>{payload.count}</div> }
const steps: Step<{ count: number }>[] = [{ id: 'typed', era: 'era', title: 'Title', caption: 'Caption', groupKey: 'shared', Scene, payload: { count: 1 } }]
export const valid = <Presentation title="Typed" steps={steps} />
// @ts-expect-error Payload must stay compatible with the declared Scene.
export const invalidStep: Step<{ count: number }> = { ...steps[0], payload: { count: 'wrong' } }
// @ts-expect-error Incompatible generic payload cannot cross the Presentation boundary.
export const invalidBoundary = <Presentation<string> title="Invalid" steps={steps} />
