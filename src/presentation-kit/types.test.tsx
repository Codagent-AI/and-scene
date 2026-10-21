import { describe, expect, expectTypeOf, it } from 'vitest'
import { render } from '@testing-library/react'
import { Presentation } from './Presentation'
import type { PresentationProps, Scene, SceneProps, Step, StepMeta } from './types'

interface Payload {
  stage: number
}
interface Other {
  label: string
}

function StageScene({ payload }: SceneProps<Payload>) {
  return <p>{payload.stage}</p>
}
function LabelScene({ payload }: SceneProps<Other>) {
  return <p>{payload.label}</p>
}

describe('Step contract (type level, compiled by `npm run build`)', () => {
  it('carries identity, era, title, caption and the diagram state', () => {
    expectTypeOf<Step<Payload>>().toHaveProperty('id').toEqualTypeOf<string>()
    expectTypeOf<Step<Payload>>().toHaveProperty('era').toEqualTypeOf<string>()
    expectTypeOf<Step<Payload>>().toHaveProperty('title').toEqualTypeOf<string>()
    expectTypeOf<Step<Payload>>().toHaveProperty('caption').toEqualTypeOf<string>()
    expectTypeOf<Step<Payload>>().toHaveProperty('payload').toEqualTypeOf<Payload>()
    expectTypeOf<Step<Payload>>().toHaveProperty('Scene').toEqualTypeOf<Scene<Payload>>()
    expectTypeOf<Step<Payload>>().toExtend<StepMeta>()
  })

  it('rejects a step missing a required field', () => {
    // @ts-expect-error the caption is required
    const missingCaption: Step<Payload> = { id: 'a', era: 'e', title: 't', Scene: StageScene, payload: { stage: 0 } }
    // @ts-expect-error the payload is required
    const missingPayload: Step<Payload> = { id: 'a', era: 'e', title: 't', caption: 'c', Scene: StageScene }
    expect([missingCaption, missingPayload]).toHaveLength(2)
  })

  it('rejects a Scene whose payload type does not match the step payload', () => {
    const mismatched: Step<Payload> = {
      id: 'a', era: 'e', title: 't', caption: 'c',
      // @ts-expect-error LabelScene wants { label }, the step carries { stage }
      Scene: LabelScene,
      payload: { stage: 0 },
    }
    const badPayload: Step<Payload> = {
      id: 'a', era: 'e', title: 't', caption: 'c', Scene: StageScene,
      // @ts-expect-error a string is not a Payload
      payload: 'nope',
    }
    expect([mismatched, badPayload]).toHaveLength(2)
  })

  it('accepts typed grouped steps at the Presentation boundary without casts', () => {
    const steps: Step<Payload>[] = [
      { id: 'a', era: 'e', title: 'A', caption: 'a', groupKey: 'g', Scene: StageScene, payload: { stage: 0 } },
      { id: 'b', era: 'e', title: 'B', caption: 'b', groupKey: 'g', Scene: StageScene, payload: { stage: 1 } },
    ]
    const mixed: Step<unknown>[] = [steps[0], { id: 'c', era: 'e', title: 'C', caption: 'c', Scene: LabelScene, payload: { label: 'x' } }]
    expectTypeOf<PresentationProps['steps']>().toExtend<readonly Step<unknown>[]>()
    const { container } = render(
      <>
        <Presentation steps={steps} title="typed" />
        <Presentation steps={mixed} title="mixed" />
      </>,
    )
    expect(container.querySelectorAll('[data-presentation-root]')).toHaveLength(2)
  })
})
