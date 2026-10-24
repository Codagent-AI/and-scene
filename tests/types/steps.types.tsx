// Compiled by `tsc -b` (npm run build). `@ts-expect-error` lines fail the build
// if the type system stops rejecting them, so these are the negative fixtures.
import { Presentation, defineStep, type SceneProps, type Step } from '../../src/presentation-kit'

interface Payload {
  count: number
}
interface Other {
  label: string
}

function Counter({ payload }: SceneProps<Payload>) {
  return <i>{payload.count}</i>
}
function Labelled({ payload }: SceneProps<Other>) {
  return <b>{payload.label}</b>
}

const meta = { id: 's', era: 'e', title: 't', caption: 'c' }

/** A typed step array reaches <Presentation> with no cast. */
export const typedSteps: Step<Payload>[] = [
  { ...meta, id: 'a', Scene: Counter, payload: { count: 1 } },
  { ...meta, id: 'b', Scene: Counter, payload: { count: 2 }, groupKey: 'g' },
]
export const typed = <Presentation steps={typedSteps} title="x" />

/** Decks mixing payload types erase them at the definition site, still type-checked there. */
export const mixed = (
  <Presentation
    steps={[
      defineStep({ ...meta, id: 'c', Scene: Counter, payload: { count: 1 } }),
      defineStep({ ...meta, id: 'd', Scene: Labelled, payload: { label: 'x' } }),
    ]}
    title="x"
  />
)

// @ts-expect-error a step must carry an id
export const noId: Step<Payload> = { era: 'e', title: 't', caption: 'c', Scene: Counter, payload: { count: 1 } }
// @ts-expect-error a step must carry an era
export const noEra: Step<Payload> = { id: 's', title: 't', caption: 'c', Scene: Counter, payload: { count: 1 } }
// @ts-expect-error a step must carry a title
export const noTitle: Step<Payload> = { id: 's', era: 'e', caption: 'c', Scene: Counter, payload: { count: 1 } }
// @ts-expect-error a step must carry a caption
export const noCaption: Step<Payload> = { id: 's', era: 'e', title: 't', Scene: Counter, payload: { count: 1 } }
// @ts-expect-error a step must carry a Scene
export const noScene: Step<Payload> = { ...meta, payload: { count: 1 } }
// @ts-expect-error the payload must match the declared type
export const badPayload: Step<Payload> = { ...meta, Scene: Counter, payload: { count: 'x' } }
// @ts-expect-error the Scene must accept the payload type
export const badScene: Step<Payload> = { ...meta, Scene: Labelled, payload: { count: 1 } }
// @ts-expect-error incompatible payload types cannot share one typed array
export const mixedTyped = <Presentation steps={[...typedSteps, { ...meta, Scene: Labelled, payload: { label: 'x' } }]} title="x" />
