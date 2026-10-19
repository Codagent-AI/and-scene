// Type-level contract, checked by `tsc -b` (npm run build) and as a runtime no-op by Vitest.
import { describe, expect, it } from 'vitest'
import { Presentation } from '../../src/presentation-kit/index.ts'
import type { SceneProps, Step, StepMeta } from '../../src/presentation-kit/index.ts'

interface Payload {
  focus: 'a' | 'b'
}

function Typed({ payload }: SceneProps<Payload>) {
  const f: 'a' | 'b' = payload.focus
  return f
}

const steps: Step<Payload>[] = [
  { id: '1', era: 'e', title: 't', caption: 'c', Scene: Typed, payload: { focus: 'a' } },
]

// Typed arrays pass straight to the host: no cast, payload type preserved.
export const ok = <Presentation steps={steps} title="x" />

// @ts-expect-error a payload of the wrong shape is rejected (the type is not erased to any)
export const bad: Step<Payload> = { id: '1', era: 'e', title: 't', caption: 'c', Scene: Typed, payload: { focus: 'z' } }

// @ts-expect-error every step needs its narration fields
export const missing: StepMeta = { id: '1', era: 'e', title: 't' }

// @ts-expect-error a scene typed for another payload cannot be mixed into the array
export const mixed: Step<Payload> = { id: '1', era: 'e', title: 't', caption: 'c', Scene: ({ payload }: SceneProps<{ n: number }>) => payload.n, payload: { focus: 'a' } }

describe('step contract types', () => {
  it('compiles with typed payloads and no casts', () => {
    expect(steps[0].payload.focus).toBe('a')
    expect([ok, bad, missing, mixed]).toHaveLength(4)
  })
})
