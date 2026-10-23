import { describe, expect, expectTypeOf, it } from 'vitest'
import type { ComponentType } from 'react'
import { computeEras, stepMarker, validateSteps } from '../../../src/presentation-kit/steps.ts'
import type { Presentation as PresentationFn } from '../../../src/presentation-kit/index.ts'
import type { SceneProps, Step } from '../../../src/presentation-kit/types.ts'
import { makeSteps, type Payload } from '../helpers/fixtures.tsx'

describe('Step model (L-1, L-3)', () => {
  it('accepts a complete step list', () => {
    expect(() => validateSteps(makeSteps())).not.toThrow()
  })

  it.each(['id', 'era', 'title', 'caption'] as const)('rejects a step missing %s', (field) => {
    const steps = makeSteps(3)
    steps[1] = { ...steps[1], [field]: '' }
    expect(() => validateSteps(steps)).toThrow(new RegExp(`Step 1 is missing required field "${field}"`))
  })

  it('rejects a step without a Scene and an empty list', () => {
    const steps = makeSteps(2)
    steps[0] = { ...steps[0], Scene: undefined as unknown as ComponentType<SceneProps<Payload>> }
    expect(() => validateSteps(steps)).toThrow(/missing its Scene/)
    expect(() => validateSteps([])).toThrow(/at least one step/)
  })

  it('rejects duplicate ids', () => {
    const steps = makeSteps(3)
    steps[2] = { ...steps[2], id: steps[0].id }
    expect(() => validateSteps(steps)).toThrow(/Duplicate step id "s1"/)
  })

  it('keeps typed payloads through the Presentation boundary without casts', () => {
    type Props = Parameters<typeof PresentationFn<Payload>>[0]
    expectTypeOf<Props['steps']>().toEqualTypeOf<readonly Step<Payload>[]>()
    expectTypeOf<Step<Payload>['payload']>().toEqualTypeOf<Payload>()
    expectTypeOf<SceneProps<Payload>['payload']>().toEqualTypeOf<Payload>()
    // @ts-expect-error a step without narration fields is rejected
    const missing: Step<Payload> = { id: 'x', payload: { n: 1 }, Scene: makeSteps(1)[0].Scene }
    // @ts-expect-error a payload of the wrong type is rejected
    const wrong: Step<Payload> = { ...makeSteps(1)[0], payload: { n: 'one' } }
    void missing
    void wrong
  })
})

describe('derived structure', () => {
  it('derives markers from position only (L-2)', () => {
    expect(stepMarker(0)).toBe('01')
    expect(stepMarker(8)).toBe('09')
    expect(stepMarker(11)).toBe('12')
  })

  it('groups consecutive eras in step order', () => {
    const eras = computeEras(makeSteps(6))
    expect(eras.map((e) => [e.label, e.firstIndex, e.indices])).toEqual([
      ['one', 0, [0, 1]],
      ['two', 2, [2, 3, 4]],
      ['three', 5, [5]],
    ])
  })

  it('does not merge separated runs of the same era', () => {
    const eras = computeEras([{ era: 'a' }, { era: 'b' }, { era: 'a' }])
    expect(eras.map((e) => e.firstIndex)).toEqual([0, 1, 2])
  })
})
