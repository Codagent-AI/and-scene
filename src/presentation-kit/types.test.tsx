import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Presentation } from './Presentation.tsx'
import type { SceneProps, Step } from './types.ts'

interface Payload {
  count: number
}

function Counter({ payload }: SceneProps<Payload>) {
  return <p data-testid="count">{payload.count}</p>
}

// A grouped scene with a typed payload reaches <Presentation> with no casts.
const typed: Step<Payload>[] = [1, 2].map((count) => ({
  id: `s${count}`,
  era: 'e',
  title: 't',
  caption: 'c',
  groupKey: 'g',
  Scene: Counter,
  payload: { count },
}))

// Steps without a payload need none.
const bare: Step[] = [{ id: 'b', era: 'e', title: 't', caption: 'c', Scene: () => null }]

// @ts-expect-error a step must carry its narration and identity
const missingFields: Step = { id: 'x', Scene: () => null }

// @ts-expect-error the payload must match what the Scene component accepts
const wrongPayload: Step<Payload> = { id: 'x', era: 'e', title: 't', caption: 'c', Scene: Counter, payload: { count: 'many' } }

// @ts-expect-error a Scene expecting another payload type is not assignable
const wrongScene: Step<{ other: string }> = { id: 'x', era: 'e', title: 't', caption: 'c', Scene: Counter, payload: { other: 'x' } }

// @ts-expect-error a payload is required when the Scene needs one
const absentPayload: Step<Payload> = { id: 'x', era: 'e', title: 't', caption: 'c', Scene: Counter }

describe('step contract', () => {
  it('passes typed payloads through Presentation without casts', () => {
    render(<Presentation steps={typed} />)
    expect(document.querySelector('[data-testid=count]')!.textContent).toBe('1')
    render(<Presentation steps={bare} />)
    // The invalid fixtures above exist only to be rejected by the type checker.
    expect([missingFields, wrongPayload, wrongScene, absentPayload]).toHaveLength(4)
  })
})
