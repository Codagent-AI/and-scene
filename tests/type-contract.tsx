import { Presentation } from '../src/presentation-kit/Presentation'
import type { Step, SceneProps } from '../src/presentation-kit/types'
function Scene({ payload }: SceneProps<{ value: number }>) { return <span>{payload.value}</span> }
const steps: Step<{ value: number }>[] = [{ id: 'one', era: 'a', title: 'One', caption: 'Caption', Scene, groupKey: 'a', payload: { value: 1 } }]
export const typedBoundary = <Presentation title="Typed" steps={steps} />
// @ts-expect-error Incorrect payload type must fail at the boundary.
export const invalidBoundary = <Presentation<string> title="Bad" steps={steps} />
