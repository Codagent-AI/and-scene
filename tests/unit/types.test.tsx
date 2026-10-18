import { describe, expectTypeOf, it } from 'vitest'
import type { ComponentType } from 'react'
import type { PresentationProps, SceneProps, Step } from '../../src/presentation-kit'

interface Payload {
  count: number
}

describe('step contract types', () => {
  it('requires each narration field and a payload-typed Scene', () => {
    expectTypeOf<Step<Payload>['id']>().toEqualTypeOf<string>()
    expectTypeOf<Step<Payload>['era']>().toEqualTypeOf<string>()
    expectTypeOf<Step<Payload>['title']>().toEqualTypeOf<string>()
    expectTypeOf<Step<Payload>['caption']>().toEqualTypeOf<string>()
    expectTypeOf<Step<Payload>['payload']>().toEqualTypeOf<Payload>()
    expectTypeOf<Step<Payload>['Scene']>().toEqualTypeOf<ComponentType<SceneProps<Payload>>>()
    expectTypeOf<Step<Payload>['groupKey']>().toEqualTypeOf<string | undefined>()
  })

  it('preserves the payload type through the Presentation boundary', () => {
    expectTypeOf<PresentationProps<Payload>['steps']>().toEqualTypeOf<ReadonlyArray<Step<Payload>>>()
    expectTypeOf<PresentationProps<Payload>['steps']>().not.toEqualTypeOf<ReadonlyArray<Step<never>>>()
    expectTypeOf<Step<Payload>>().not.toExtend<Step<{ name: string }>>()
  })
})
