import { Presentation } from '../src/presentation-kit/Presentation'
import type { Step, SceneProps } from '../src/presentation-kit/types'
function Typed({ payload }: SceneProps<{ label: string; count: number }>) { return <div>{payload.label}: {payload.count}</div> }
const typed: Step<{ label: string; count: number }>[] = [{ id: 'typed', era: 'one', title: 'Typed', caption: 'Typed payload.', groupKey: 'typed', Scene: Typed, payload: { label: 'yes', count: 2 } }]
export const boundary = <Presentation steps={typed} title="Typed" />
// @ts-expect-error incorrect payload must not cross the boundary
export const invalid = <Presentation steps={typed} title="Typed" initialMode="invalid" />
// @ts-expect-error missing caption and identity are invalid
export const incomplete: Step<{ label: string; count: number }> = { Scene: Typed, payload: { label:'no',count:1 } }
// @ts-expect-error payload type is preserved
export const wrongPayload: Step<{ label: string; count: number }> = { ...typed[0], payload: { label: 'bad', count: 'wrong' } }
