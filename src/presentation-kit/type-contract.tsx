// A compile-only public-boundary contract. No casts or payload widening.
import { Presentation } from './Presentation'
import type { SceneProps, Step } from './types'
interface Payload { label: string; count: number }
function TypedScene({ payload }: SceneProps<Payload>) { return <span>{payload.label}: {payload.count}</span> }
const typedSteps: readonly Step<Payload>[] = [{ id: 'typed', era: 'test', title: 'Typed', caption: 'Typed payload', groupKey: 'typed', Scene: TypedScene, payload: { label: 'count', count: 1 } }]
export function TypeContract() { return <Presentation title="typed" steps={typedSteps} /> }
// @ts-expect-error The scene cannot accept an incompatible payload.
const invalidPayload: Step<Payload> = { ...typedSteps[0], payload: { count: 'wrong' } }
void invalidPayload
