/* eslint-disable react-refresh/only-export-components */
import { Presentation, type SceneProps, type Step } from '../presentation-kit'

// Compiled by `tsc -b`: a typed grouped payload reaches <Presentation> without casts.
interface CounterPayload {
  count: number
}

function CounterScene({ payload }: SceneProps<CounterPayload>) {
  return <span>{payload.count}</span>
}

function LabelScene({ payload }: SceneProps<string>) {
  return <span>{payload}</span>
}

const steps: Step<CounterPayload>[] = [
  { id: 'a', era: 'e', title: 't', caption: 'c', Scene: CounterScene, groupKey: 'g', payload: { count: 1 } },
  { id: 'b', era: 'e', title: 't', caption: 'c', Scene: CounterScene, groupKey: 'g', payload: { count: 2 } },
]

export const typed = <Presentation steps={steps} title="typed" />

// A Scene whose payload type differs from the step's payload must be rejected.
const mismatched: Step<CounterPayload> = {
  id: 'x',
  era: 'e',
  title: 't',
  caption: 'c',
  // @ts-expect-error LabelScene expects a string payload, not CounterPayload
  Scene: LabelScene,
  payload: { count: 1 },
}

// Presentation infers its payload from the steps, so mixed payloads are rejected too.
// @ts-expect-error steps with different payload types cannot share one Presentation
export const mixed = <Presentation steps={[steps[0], { id: 'y', era: 'e', title: 't', caption: 'c', Scene: LabelScene, payload: 'hi' }]} title="mixed" />

export const unused = mismatched
