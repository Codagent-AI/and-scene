import { Presentation } from '../src/presentation-kit/Presentation'
import type { SceneProps, Step } from '../src/presentation-kit/types'
interface Payload { label: string; count: number }
export function Scene({ payload }: SceneProps<Payload>) { return <div>{payload.label}{payload.count}</div> }
const step: Step<Payload> = { id: 'one', era: 'intro', title: 'One', caption: 'Explain.',
  groupKey: 'main', Scene, payload: { label: 'typed', count: 1 } }
const valid = <Presentation steps={[step]} title="Typed" />
// @ts-expect-error The payload's count must be numeric.
const invalidPayload: Step<Payload> = { ...step, payload: { label: 'bad', count: 'bad' } }
// @ts-expect-error The host must retain the concrete payload type.
const invalidBoundary = <Presentation<number> steps={[step]} title="Invalid" />
// @ts-expect-error Required narration must be present.
const missingCaption: Step<Payload> = { id: 'x', era: 'intro', title: 'X', Scene, payload: { label: 'x', count: 1 } }

void [valid, invalidPayload, invalidBoundary, missingCaption]
