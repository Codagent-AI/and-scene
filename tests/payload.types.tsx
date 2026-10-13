// Compiled by the production TypeScript build as well as the test typecheck.
import { Presentation } from '../src/presentation-kit/Presentation'
import type { SceneProps, Step } from '../src/presentation-kit/types'
function TypedScene({ payload }: SceneProps<{ label: string; count: number }>) {
  return <div>{payload.label}: {payload.count}</div>
}
const steps: Step<{ label: string; count: number }>[] = [{
  id: 'typed', era: 'type safety', title: 'Typed', caption: 'Payload remains typed',
  Scene: TypedScene, groupKey: 'typed', payload: { label: 'value', count: 1 },
}]
export const valid = <Presentation steps={steps} title="Typed" />
// @ts-expect-error Incorrect payload shapes must fail at the host boundary.
export const invalid = <Presentation steps={[{ ...steps[0], payload: { label: 123 } }]} title="Invalid" />
