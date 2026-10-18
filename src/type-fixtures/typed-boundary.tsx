// Compile-time fixtures for the typed step contract. `tsc -b` (npm run build)
// fails if the positive case stops compiling or a negative case starts compiling.
import { Presentation, type SceneProps, type Step } from '../presentation-kit'

interface Payload {
  count: number
}

function CountScene({ payload }: SceneProps<Payload>) {
  return <span>{payload.count}</span>
}

function NameScene({ payload }: SceneProps<{ name: string }>) {
  return <span>{payload.name}</span>
}

const steps: Step<Payload>[] = [
  { id: 'a', era: 'e', title: 't', caption: 'c', Scene: CountScene, groupKey: 'g', payload: { count: 1 } },
]

// Positive: a typed step array crosses the <Presentation> boundary without casts.
export const typed = <Presentation steps={steps} title="Typed" />

// Negative: a payload that does not match the Scene's props is rejected.
export const wrongPayload: Step<Payload> = {
  id: 'b',
  era: 'e',
  title: 't',
  caption: 'c',
  Scene: CountScene,
  // @ts-expect-error payload must be { count: number }
  payload: { count: 'one' },
}

// Negative: a Scene expecting another payload shape is rejected.
export const wrongScene: Step<Payload> = {
  id: 'c',
  era: 'e',
  title: 't',
  caption: 'c',
  // @ts-expect-error NameScene needs { name: string }
  Scene: NameScene,
  payload: { count: 1 },
}

// Negative: every narration field is required on a step.
// @ts-expect-error missing caption
export const missingCaption: Step<Payload> = { id: 'd', era: 'e', title: 't', Scene: CountScene, payload: { count: 1 } }

// Negative: the payload type is inferred, so mixed payload arrays are rejected.
export const mixed = (
  // @ts-expect-error steps must share one payload type
  <Presentation steps={[...steps, { id: 'e', era: 'e', title: 't', caption: 'c', Scene: NameScene, payload: { name: 'n' } }]} title="Mixed" />
)
