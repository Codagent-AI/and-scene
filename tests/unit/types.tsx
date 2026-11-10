// Compiled with the type-contract command, including negative assertions.
import { Presentation } from '../../src/presentation-kit/Presentation'
import type { SceneProps, Step } from '../../src/presentation-kit/types'
function TypedScene({ payload }: SceneProps<{ label: string; count: number }>) { return <p>{payload.label} {payload.count}</p> }
const typed: Step<{ label: string; count: number }>[] = [{ id: 'one', era: 'start', title: 'One', caption: 'First.', groupKey: 'same', Scene: TypedScene, payload: { label: 'typed', count: 1 } }]
export const positive = <Presentation steps={typed} title="Typed" />
// @ts-expect-error payload must retain its shape
export const badPayload: Step<{ count: number }> = { ...typed[0], payload: { count: 'wrong' } }
// @ts-expect-error scene payload mismatch cannot pass the presentation boundary
export const badBoundary = <Presentation<number> steps={typed} title="Bad" />
// @ts-expect-error narration metadata is mandatory
export const missing: Step<number> = { id: 'missing', Scene: () => null, payload: 1 }
