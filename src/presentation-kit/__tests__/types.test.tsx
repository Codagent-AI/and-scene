import { describe, expect, it } from 'vitest'
import { Presentation } from '../Presentation'
import type { SceneProps, Step } from '../types'

interface Payload {
  count: number
}

function CountScene({ payload }: SceneProps<Payload>) {
  return <span>{payload.count.toFixed(0)}</span>
}

const meta = { id: 'a', era: 'e', title: 't', caption: 'c' }

describe('typed payloads', () => {
  it('reach <Presentation> without casts, and invalid shapes fail type checking', () => {
    const steps: Step<Payload>[] = [{ ...meta, Scene: CountScene, payload: { count: 1 } }]
    // The assertions below are enforced by `tsc -b` (npm run build).
    const ok = <Presentation steps={steps} title="x" />
    // @ts-expect-error payload does not match the Scene's payload type
    const badPayload: Step<Payload> = { ...meta, Scene: CountScene, payload: { count: 'one' } }
    // @ts-expect-error a step requires its narration fields
    const missingMeta: Step<Payload> = { id: 'a', Scene: CountScene, payload: { count: 1 } }
    // @ts-expect-error a Scene for another payload type is rejected
    const wrongScene: Step<{ other: string }> = { ...meta, Scene: CountScene, payload: { other: 'x' } }
    // @ts-expect-error the presentation rejects steps of a different payload type
    const mixed = <Presentation<Payload> steps={[wrongScene]} title="x" />
    expect([ok, badPayload, missingMeta, mixed]).toHaveLength(4)
  })
})
