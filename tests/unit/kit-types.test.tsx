import { describe, expect, expectTypeOf, it } from 'vitest'
import { Presentation, type SceneProps, type Step } from '../../src/presentation-kit/index.ts'
import type { StepMeta } from '../../src/presentation-kit/types.ts'

// These assertions are checked by `tsc -b` (part of `npm run build`); vitest only
// executes the trivial runtime bodies.

interface Payload {
  focus: 'a' | 'b'
  items: { id: string; weight: number }[]
}

function TypedScene({ payload }: SceneProps<Payload>) {
  return <div>{payload.items.length}</div>
}
function OtherScene({ payload }: SceneProps<{ unrelated: number }>) {
  return <div>{payload.unrelated}</div>
}

const typed: Step<Payload>[] = [
  { id: 'a', era: 'e', title: 't', caption: 'c', Scene: TypedScene, payload: { focus: 'a', items: [] }, groupKey: 'g' },
  { id: 'b', era: 'e', title: 't', caption: 'c', Scene: TypedScene, payload: { focus: 'b', items: [{ id: 'x', weight: 1 }] }, groupKey: 'g' },
]

describe('step contract types', () => {
  it('requires id, era, title, caption, Scene and payload', () => {
    // @ts-expect-error missing id
    const noId: Step<Payload> = { era: 'e', title: 't', caption: 'c', Scene: TypedScene, payload: typed[0].payload }
    // @ts-expect-error missing era
    const noEra: Step<Payload> = { id: 'a', title: 't', caption: 'c', Scene: TypedScene, payload: typed[0].payload }
    // @ts-expect-error missing title
    const noTitle: Step<Payload> = { id: 'a', era: 'e', caption: 'c', Scene: TypedScene, payload: typed[0].payload }
    // @ts-expect-error missing caption
    const noCaption: Step<Payload> = { id: 'a', era: 'e', title: 't', Scene: TypedScene, payload: typed[0].payload }
    // @ts-expect-error missing payload
    const noPayload: Step<Payload> = { id: 'a', era: 'e', title: 't', caption: 'c', Scene: TypedScene }
    expect([noId, noEra, noTitle, noCaption, noPayload]).toHaveLength(5)
    expectTypeOf<StepMeta>().toEqualTypeOf<Pick<Step, 'id' | 'era' | 'title' | 'caption'>>()
  })

  it('passes a typed grouped payload through <Presentation> without casts', () => {
    expectTypeOf(Presentation<Payload>).parameter(0).toHaveProperty('steps').toEqualTypeOf<readonly Step<Payload>[]>()
    // inferred from the steps array, no cast and no explicit type argument
    const el = <Presentation steps={typed} title="d" />
    expect(el).toBeTruthy()
    expectTypeOf(typed[0].payload.focus).toEqualTypeOf<'a' | 'b'>()
    expectTypeOf(typed[0].Scene).toEqualTypeOf<Step<Payload>['Scene']>()
  })

  it('rejects an incompatible payload or Scene so any-typing cannot make the fixture vacuous', () => {
    // @ts-expect-error payload does not match the Scene's payload type
    const badPayload: Step<Payload> = { id: 'a', era: 'e', title: 't', caption: 'c', Scene: TypedScene, payload: { focus: 'c', items: [] } }
    // @ts-expect-error Scene expects a different payload
    const badScene: Step<Payload> = { id: 'a', era: 'e', title: 't', caption: 'c', Scene: OtherScene, payload: typed[0].payload }
    // @ts-expect-error mixing payload types in one steps array is rejected at the boundary
    const badBoundary = <Presentation steps={[typed[0], { id: 'o', era: 'e', title: 't', caption: 'c', Scene: OtherScene, payload: { unrelated: 1 } }]} title="d" />
    expect([badPayload, badScene, badBoundary]).toHaveLength(3)
    expectTypeOf<Step<Payload>['payload']>().not.toBeAny()
    expectTypeOf<SceneProps<Payload>['payload']>().not.toBeAny()
  })
})
