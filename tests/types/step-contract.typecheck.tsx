// Compiled by `npm run build` (tsc -b). Each @ts-expect-error line must fail
// to type-check, so relaxing the step contract breaks the build.
import { Presentation, type SceneProps, type Step } from '../../src/presentation-kit'

interface Payload {
  label: string
}

function PayloadScene({ payload }: SceneProps<Payload>) {
  return <span>{payload.label.toUpperCase()}</span>
}

const meta = { id: 'a', era: 'e', title: 't', caption: 'c' }

export const typed: Step<Payload>[] = [
  { ...meta, Scene: PayloadScene, payload: { label: 'one' }, groupKey: 'g' },
  { ...meta, id: 'b', Scene: PayloadScene, payload: { label: 'two' }, groupKey: 'g' },
]

// Typed array reaches <Presentation> with no casts.
export const host = <Presentation steps={typed} title="typed" />

// @ts-expect-error id is required
export const noId: Step<Payload> = { era: 'e', title: 't', caption: 'c', Scene: PayloadScene, payload: { label: 'x' } }
// @ts-expect-error era is required
export const noEra: Step<Payload> = { id: 'a', title: 't', caption: 'c', Scene: PayloadScene, payload: { label: 'x' } }
// @ts-expect-error title is required
export const noTitle: Step<Payload> = { id: 'a', era: 'e', caption: 'c', Scene: PayloadScene, payload: { label: 'x' } }
// @ts-expect-error caption is required
export const noCaption: Step<Payload> = { id: 'a', era: 'e', title: 't', Scene: PayloadScene, payload: { label: 'x' } }
// @ts-expect-error Scene is required
export const noScene: Step<Payload> = { id: 'a', era: 'e', title: 't', caption: 'c', payload: { label: 'x' } }
// @ts-expect-error payload is required
export const noPayload: Step<Payload> = { id: 'a', era: 'e', title: 't', caption: 'c', Scene: PayloadScene }
// @ts-expect-error payload must match the Scene's payload type
export const wrongPayload: Step<Payload> = { ...meta, Scene: PayloadScene, payload: { label: 3 } }
// @ts-expect-error payload type is not erased to any: unknown properties are rejected
export const extraPayload: Step<Payload> = { ...meta, Scene: PayloadScene, payload: { label: 'x', other: 1 } }
// @ts-expect-error Scene payload type must agree with the step payload type
export const mismatched: Step<Payload> = { ...meta, Scene: ({ payload }: SceneProps<{ n: number }>) => <i>{payload.n}</i>, payload: { label: 'x' } }
// @ts-expect-error a step array with a different payload type is rejected by the host
export const badHost = <Presentation<{ n: number }> steps={typed} title="bad" />
