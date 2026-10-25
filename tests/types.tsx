import { Presentation } from '../src/presentation-kit'
import type { SceneProps, Step } from '../src/presentation-kit/types'
function Typed({ payload }: SceneProps<{ count: number }>) { return <span>{payload.count}</span> }
const steps: Step<{ count: number }>[] = [{ id: 'typed', era: 'one', title: 'Typed', caption: 'Typed payload', Scene: Typed, payload: { count: 1 }, groupKey: 'typed' }]
export function TypeContract() { return <Presentation steps={steps} title="Typed" /> }
// @ts-expect-error A string is not an accepted grouped payload count.
const invalid: Step<{ count: number }> = { ...steps[0], payload: { count: 'wrong' } }
void invalid
