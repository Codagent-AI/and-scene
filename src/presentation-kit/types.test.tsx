import { describe, expect, it } from 'vitest'
import { Presentation } from './Presentation.tsx'
import type { SceneProps, Step } from './types.ts'

interface Payload {
  count: number
}
const Counter = ({ payload }: SceneProps<Payload>) => <span>{payload.count}</span>
const OtherScene = ({ payload }: SceneProps<{ label: string }>) => <span>{payload.label}</span>

const meta = { id: 'a', era: 'e', title: 't', caption: 'c' }

describe('step contract (compile-time)', () => {
  it('accepts a typed grouped payload at the Presentation boundary with no casts', () => {
    const steps: Step<Payload>[] = [
      { ...meta, groupKey: 'g', Scene: Counter, payload: { count: 1 } },
      { ...meta, id: 'b', groupKey: 'g', Scene: Counter, payload: { count: 2 } },
    ]
    const element = <Presentation steps={steps} title="typed" />
    expect(element.props.steps).toHaveLength(2)
  })

  it('requires every step field and rejects mismatched payloads', () => {
    // @ts-expect-error id is required
    const noId: Step<Payload> = { era: 'e', title: 't', caption: 'c', Scene: Counter, payload: { count: 1 } }
    // @ts-expect-error era is required
    const noEra: Step<Payload> = { id: 'a', title: 't', caption: 'c', Scene: Counter, payload: { count: 1 } }
    // @ts-expect-error title is required
    const noTitle: Step<Payload> = { id: 'a', era: 'e', caption: 'c', Scene: Counter, payload: { count: 1 } }
    // @ts-expect-error caption is required
    const noCaption: Step<Payload> = { id: 'a', era: 'e', title: 't', Scene: Counter, payload: { count: 1 } }
    // @ts-expect-error diagram state (Scene and payload) is required
    const noScene: Step<Payload> = { id: 'a', era: 'e', title: 't', caption: 'c' }
    // @ts-expect-error the payload must match the Scene's payload type
    const wrongPayload: Step<Payload> = { ...meta, Scene: Counter, payload: { count: 'one' } }
    // @ts-expect-error a Scene for another payload type is rejected, not erased
    const wrongScene: Step<Payload> = { ...meta, Scene: OtherScene, payload: { count: 1 } }
    expect([noId, noEra, noTitle, noCaption, noScene, wrongPayload, wrongScene]).toHaveLength(7)
  })
})
