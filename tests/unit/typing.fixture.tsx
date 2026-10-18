/** Type-level fixture: compiled by `tsc -b` (npm run build) and imported by a test. */
import { Presentation, type SceneProps, type Step } from '../../src/presentation-kit'

interface A { n: number }
interface B { s: string }
function SceneA({ payload }: SceneProps<A>) {
  return <i>{payload.n}</i>
}
function SceneB({ payload }: SceneProps<B>) {
  return <i>{payload.s}</i>
}

const a: Step<A>[] = [{ id: 'a', era: 'e', title: 't', caption: 'c', Scene: SceneA, groupKey: 'g', payload: { n: 1 } }]
const b: Step<B>[] = [{ id: 'b', era: 'e', title: 't', caption: 'c', Scene: SceneB, payload: { s: 'x' } }]

/** Typed grouped payload arrays go straight into <Presentation>, no casts, no `any`. */
export const typed = <Presentation title="t" steps={[...a, ...b]} />

// @ts-expect-error payload does not match the Scene's payload type
export const mismatch: Step<A> = { id: 'x', era: 'e', title: 't', caption: 'c', Scene: SceneA, payload: { s: 'no' } }

// @ts-expect-error every narration field is required
export const missing: Step<A> = { id: 'x', era: 'e', title: 't', Scene: SceneA, payload: { n: 1 } }

// @ts-expect-error a Scene whose payload type differs from the step payload is rejected
export const wrongScene: Step<A> = { id: 'x', era: 'e', title: 't', caption: 'c', Scene: SceneB, payload: { n: 1 } }
