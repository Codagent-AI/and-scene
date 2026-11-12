// Compile-only examples keep the public generic boundary honest.
import { Presentation } from './Presentation'
import type { SceneProps, Step } from './types'
function TypedScene({ payload }: SceneProps<{ count: number }>) { return <span>{payload.count}</span> }
const typedSteps: Step<{ count: number }>[] = [{ id: 'typed', era: 'example', title: 'Typed', caption: 'Typed payload.', groupKey: 'typed', Scene: TypedScene, payload: { count: 1 } }]
export function TypedBoundaryContract() { return <Presentation title="Typed" steps={typedSteps} /> }
// @ts-expect-error Invalid scene payloads must be rejected by the public boundary.
const invalidStep: Step<{ count: number }> = { ...typedSteps[0], payload: { count: 'wrong' } }
void invalidStep
