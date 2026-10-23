// Compile-time contract for the step model. Checked by `tsc -b` (npm run build);
// every @ts-expect-error below must keep erroring or the build fails.
import { Presentation, type SceneProps, type Step } from '../../src/presentation-kit/index.ts'

interface Payload {
  count: number
}

const Scene = ({ payload }: SceneProps<Payload>) => <p>{payload.count}</p>
const Plain = () => <p />

const base = { id: 'a', era: 'e', title: 't', caption: 'c' }

// A fully specified grouped step is accepted, and the typed array reaches <Presentation> without casts.
const typed: Step<Payload>[] = [{ ...base, Scene, groupKey: 'g', payload: { count: 1 } }]
export const accepted = <Presentation steps={typed} title="typed" />

// Steps without a payload need none.
const plain: Step[] = [{ ...base, Scene: Plain }]
export const acceptedPlain = <Presentation steps={plain} title="plain" />

// Each required field is rejected when omitted.
// @ts-expect-error id is required
export const noId: Step = { era: 'e', title: 't', caption: 'c', Scene: Plain }
// @ts-expect-error era is required
export const noEra: Step = { id: 'a', title: 't', caption: 'c', Scene: Plain }
// @ts-expect-error title is required
export const noTitle: Step = { id: 'a', era: 'e', caption: 'c', Scene: Plain }
// @ts-expect-error caption is required
export const noCaption: Step = { id: 'a', era: 'e', title: 't', Scene: Plain }
// @ts-expect-error the diagram state (Scene) is required
export const noScene: Step = { id: 'a', era: 'e', title: 't', caption: 'c' }

// A payload-typed step must carry its payload, and the payload must match the Scene.
// @ts-expect-error payload is required when the Scene needs one
export const noPayload: Step<Payload> = { ...base, Scene }
// @ts-expect-error payload shape must match
export const wrongPayload: Step<Payload> = { ...base, Scene, payload: { count: 'x' } }
// @ts-expect-error a Scene for another payload type is rejected
export const wrongScene: Step<Payload> = { ...base, Scene: ({ payload }: SceneProps<{ name: string }>) => <p>{payload.name}</p>, payload: { count: 1 } }

// Widening a typed step array to an untyped one is rejected.
// @ts-expect-error Step<Payload>[] is not assignable to Step[]
export const widened: Step[] = typed
