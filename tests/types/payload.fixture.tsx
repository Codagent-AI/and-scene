// Compiled by `tsc -b` (npm run build). Each @ts-expect-error must fire, or the
// build fails with an "unused directive" error: that is the checked expectation.
import { Presentation } from '../../src/presentation-kit/index.ts'
import type { SceneProps, Step } from '../../src/presentation-kit/index.ts'

interface Payload {
  count: number
}

function Counter({ payload }: SceneProps<Payload>) {
  return <p>{payload.count}</p>
}

const meta = { id: 'a', era: 'e', title: 't', caption: 'c' }

const steps: Step<Payload>[] = [
  { ...meta, groupKey: 'g', Scene: Counter, payload: { count: 1 } },
  { ...meta, id: 'b', groupKey: 'g', Scene: Counter, payload: { count: 2 } },
]

export const typed = <Presentation steps={steps} title="typed" />

// @ts-expect-error: a payload of the wrong type is rejected at the Step boundary
export const wrongPayload: Step<Payload> = { ...meta, Scene: Counter, payload: { count: 'many' } }

// @ts-expect-error: required narration fields cannot be omitted
export const missingCaption: Step<Payload> = { id: 'x', era: 'e', title: 't', Scene: Counter, payload: { count: 1 } }

export const mismatchedScene = (
  // @ts-expect-error: a Scene that expects a different payload cannot join the typed array
  <Presentation steps={[{ ...meta, Scene: Counter, payload: { label: 'nope' } }]} title="x" />
)
