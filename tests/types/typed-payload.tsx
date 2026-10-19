// Compile-time fixture: checked by `tsc -b` (tsconfig.app.json includes tests/types).
// Positive cases must compile with no casts or `any`; `@ts-expect-error` lines must fail to compile.
import type { ReactElement } from 'react'
import { Presentation, type SceneProps, type Step } from '../../src/presentation-kit'

interface DiagramState {
  count: number
  label: string
}

function TypedScene({ payload, stepIndex }: SceneProps<DiagramState>): ReactElement {
  return (
    <div data-stepindex={stepIndex}>
      {payload.label}
      {payload.count}
    </div>
  )
}

function OtherScene({ payload }: SceneProps<string>): ReactElement {
  return <div>{payload}</div>
}

const typedSteps: Step<DiagramState>[] = [
  { id: 'one', era: 'Era', title: 'One', caption: 'First', Scene: TypedScene, payload: { count: 1, label: 'a' } },
  { id: 'two', era: 'Era', title: 'Two', caption: 'Second', Scene: TypedScene, payload: { count: 2, label: 'b' } },
]

// Positive: typed grouped payloads pass straight through <Presentation>.
export function TypedDeck(): ReactElement {
  return <Presentation steps={typedSteps} title="Typed" />
}

// Positive: a step with no payload field compiles when its Scene takes no payload.
const plainSteps: Step[] = [{ id: 'plain', era: 'Era', title: 'Plain', caption: 'Plain', Scene: PlainScene }]
function PlainScene(): ReactElement {
  return <div />
}
export function PlainDeck(): ReactElement {
  return <Presentation steps={plainSteps} title="Plain" />
}

// Negative: a payload of the wrong shape is rejected.
export const wrongPayload: Step<DiagramState> = {
  id: 'bad',
  era: 'Era',
  title: 'Bad',
  caption: 'Bad',
  Scene: TypedScene,
  // @ts-expect-error payload.count must be a number
  payload: { count: 'three', label: 'c' },
}

// Negative: a Scene expecting a different payload type is rejected.
export const wrongScene: Step<DiagramState> = {
  id: 'bad-scene',
  era: 'Era',
  title: 'Bad',
  caption: 'Bad',
  // @ts-expect-error Scene payload type does not match Step payload
  Scene: OtherScene,
  payload: { count: 1, label: 'c' },
}

// Negative: an explicit payload type cannot be forced onto a differently typed step array.
const mixedSteps: Step<string>[] = [{ id: 'x', era: 'Era', title: 'X', caption: 'X', Scene: OtherScene, payload: 'x' }]
export function MismatchedDeck(): ReactElement {
  return (
    <Presentation<DiagramState>
      // @ts-expect-error Step<string>[] does not satisfy Step<DiagramState>[]
      steps={mixedSteps}
      title="Mismatch"
    />
  )
}

// Negative: a payload-bearing step must supply its payload.
// @ts-expect-error payload is required when TPayload is not undefined
export const missingPayload: Step<DiagramState> = {
  id: 'nopayload',
  era: 'Era',
  title: 'Bad',
  caption: 'Bad',
  Scene: TypedScene,
}

// Negative: each required identity and presenter field must be present (I-1).
// @ts-expect-error id is required
export const missingId: Step = { era: 'Era', title: 'T', caption: 'C', Scene: PlainScene }
// @ts-expect-error era is required
export const missingEra: Step = { id: 'a', title: 'T', caption: 'C', Scene: PlainScene }
// @ts-expect-error title is required
export const missingTitle: Step = { id: 'a', era: 'Era', caption: 'C', Scene: PlainScene }
// @ts-expect-error caption is required
export const missingCaption: Step = { id: 'a', era: 'Era', title: 'T', Scene: PlainScene }
// @ts-expect-error Scene is required
export const missingScene: Step = { id: 'a', era: 'Era', title: 'T', caption: 'C' }
