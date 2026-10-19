// Compile-time contract: `tsc -b` (npm run build) type-checks this file.
// Valid fixtures must compile without casts; the @ts-expect-error lines fail
// the build if payload types are ever erased to `any`/`unknown`.
import { Presentation, type SceneProps, type Step } from '../../src/presentation-kit'

interface Payload {
  phase: number
}
interface Other {
  label: string
}

const Scene = ({ payload }: SceneProps<Payload>) => <p>{payload.phase}</p>
const OtherScene = ({ payload }: SceneProps<Other>) => <p>{payload.label}</p>

const steps: Step<Payload>[] = [
  { id: 'a', era: 'e', title: 't', caption: 'c', groupKey: 'g', Scene, payload: { phase: 1 } },
  { id: 'b', era: 'e', title: 't', caption: 'c', groupKey: 'g', Scene, payload: { phase: 2 } },
]

export const accepted = <Presentation steps={steps} title="typed" />

// @ts-expect-error payload does not match the scene's payload type
export const wrongPayload: Step<Payload> = { id: 'x', era: 'e', title: 't', caption: 'c', Scene, payload: { label: 'no' } }

// @ts-expect-error a scene typed for another payload cannot be mixed in
export const wrongScene: Step<Payload> = { id: 'x', era: 'e', title: 't', caption: 'c', Scene: OtherScene, payload: { phase: 1 } }

// @ts-expect-error steps with different payload types cannot share one array
export const mixed = <Presentation steps={[steps[0], { id: 'o', era: 'e', title: 't', caption: 'c', Scene: OtherScene, payload: { label: 'x' } }]} title="mixed" />
