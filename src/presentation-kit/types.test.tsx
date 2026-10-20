// @vitest-environment jsdom
// Type-contract fixture: `tsc -b` (npm run build) checks this file, including the expected errors.
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Presentation } from './Presentation.tsx'
import type { SceneProps, Step } from './types.ts'

interface Typed {
  count: number
  tags: string[]
}

function TypedScene({ payload }: SceneProps<Typed>) {
  return <p data-testid="typed">{payload.count + payload.tags.length}</p>
}

const steps: Step<Typed>[] = [
  { id: 'a', era: 'e', title: 't', caption: 'c', Scene: TypedScene, payload: { count: 2, tags: ['x'] } },
]

describe('typed step contract', () => {
  it('passes a concretely typed Step array to Presentation without casts and reads typed fields', () => {
    const { getByTestId } = render(<Presentation steps={steps} title="Typed" />)
    expect(getByTestId('typed').textContent).toBe('3')
  })

  it('rejects wrong payloads, missing narration, and mismatched scenes at compile time', () => {
    const noop = () => {
      // @ts-expect-error payload does not match the scene's payload type
      const wrongPayload: Step<Typed> = { id: 'a', era: 'e', title: 't', caption: 'c', Scene: TypedScene, payload: { count: 'x', tags: [] } }
      // @ts-expect-error caption is required
      const missingCaption: Step<Typed> = { id: 'a', era: 'e', title: 't', Scene: TypedScene, payload: { count: 1, tags: [] } }
      // @ts-expect-error the id is required for stable identity
      const missingId: Step<Typed> = { era: 'e', title: 't', caption: 'c', Scene: TypedScene, payload: { count: 1, tags: [] } }
      // @ts-expect-error steps with a different payload type are not accepted
      const wrongSteps = <Presentation<Typed> steps={[{ id: 'b', era: 'e', title: 't', caption: 'c', Scene: TypedScene, payload: 5 }]} title="x" />
      return [wrongPayload, missingCaption, missingId, wrongSteps]
    }
    expect(typeof noop).toBe('function')
  })
})
