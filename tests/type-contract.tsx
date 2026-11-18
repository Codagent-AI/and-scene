import { Presentation } from '../src/presentation-kit'
import type { Step, SceneProps } from '../src/presentation-kit'
export function Scene({ payload }: SceneProps<{ count: number }>) { return <span>{payload.count}</span> }
const steps: readonly Step<{ count: number }>[] = [{ id:'typed', era:'one', title:'Typed', caption:'Typed payload.', groupKey:'typed', Scene, payload:{count:1} }]
const valid = <Presentation steps={steps} title="Typed" />
// @ts-expect-error wrong payload is rejected at the Presentation boundary
const invalid = <Presentation<{ count: string }> steps={steps} title="Wrong" />

void valid
void invalid
