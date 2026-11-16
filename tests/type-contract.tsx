import { Presentation } from '../src/presentation-kit'
import type { SceneProps, Step } from '../src/presentation-kit'
interface Payload { count: number; label: string }
const Scene = ({ payload }: SceneProps<Payload>) => <p>{payload.label}: {payload.count}</p>
const steps: Step<Payload>[] = [{ id: 'typed', era: 'start', title: 'Typed', caption: 'Typed caption.', groupKey: 'same', Scene, payload: { count: 1, label: 'one' } }]
export const valid = <Presentation steps={steps} title="Typed" />
// @ts-expect-error Incompatible payload must not be accepted.
export const wrongPayload: Step<Payload> = { ...steps[0], payload: { count: 'wrong', label: 'one' } }
// @ts-expect-error Scene cannot consume an incompatible payload at the host boundary.
export const wrongScene = <Presentation<string> steps={steps} title="Wrong" />
