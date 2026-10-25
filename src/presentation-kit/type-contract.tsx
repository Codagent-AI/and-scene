// Compiled by the production build: both the positive and rejected public APIs matter.
import { Presentation } from './Presentation'
import type { SceneProps, Step } from './types'
interface Payload { message: string; count: number }
const Scene = ({ payload }: SceneProps<Payload>) => <span>{payload.message} {payload.count}</span>
export const typedSteps: Step<Payload>[] = [{ id: 'typed', era: 'types', title: 'Typed', caption: 'A typed caption.', groupKey: 'typed', Scene, payload: { message: 'hello', count: 1 } }]
export const typedBoundary = <Presentation steps={typedSteps} title="Typed" />
// @ts-expect-error The payload must agree with Scene, rather than degrading to any.
export const rejectedBoundary = <Presentation steps={typedSteps} title="Rejected" initialMode="invalid" />
// @ts-expect-error Strong payload shape is enforced in JSX.
export const rejectedPayload = <Presentation<Payload> steps={[{ ...typedSteps[0], payload: { message: 42, count: 1 } }]} title="Rejected payload" />
