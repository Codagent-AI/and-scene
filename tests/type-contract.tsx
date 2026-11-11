import { Presentation } from '../src/presentation-kit/Presentation'
import type { SceneProps, Step } from '../src/presentation-kit/types'
interface Payload { label: string; count: number }
function Scene({ payload }: SceneProps<Payload>) { return <div>{payload.label}{payload.count}</div> }
const step: Step<Payload> = { id: 'one', era: 'intro', title: 'One', caption: 'Explain.',
  groupKey: 'main', Scene, payload: { label: 'typed', count: 1 } }
export const valid = <Presentation steps={[step]} title="Typed" />
// @ts-expect-error The payload's count must be numeric.
export const invalidPayload: Step<Payload> = { ...step, payload: { label: 'bad', count: 'bad' } }
// @ts-expect-error The host must retain the concrete payload type.
export const invalidBoundary = <Presentation<number> steps={[step]} title="Invalid" />
// @ts-expect-error Required narration must be present.
export const missingCaption: Step<Payload> = { id: 'x', era: 'intro', title: 'X', Scene, payload: { label: 'x', count: 1 } }
