import { describe, expect, it } from 'vitest'
import { defineStep, type AnyStep, type SceneProps } from './types.ts'

interface Payload {
  beat: number
}
const Scene = ({ payload }: SceneProps<Payload>) => payload.beat

describe('typed step payloads', () => {
  it('lets typed grouped steps into a step array without casts', () => {
    const steps: AnyStep[] = [
      defineStep({ id: 'a', era: 'e', title: 't', caption: 'c', Scene, groupKey: 'g', payload: { beat: 1 } }),
      defineStep({ id: 'b', era: 'e', title: 't', caption: 'c', Scene, groupKey: 'g', payload: { beat: 2 } }),
    ]
    expect(steps).toHaveLength(2)
  })

  it('rejects payloads that do not match the scene', () => {
    // @ts-expect-error payload.beat must be a number
    defineStep({ id: 'a', era: 'e', title: 't', caption: 'c', Scene, payload: { beat: 'one' } })
    // @ts-expect-error payload is required by the scene's payload type
    defineStep({ id: 'a', era: 'e', title: 't', caption: 'c', Scene })
    expect(true).toBe(true)
  })
})
