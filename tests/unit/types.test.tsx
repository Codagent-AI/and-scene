import { describe, expect, expectTypeOf, it } from 'vitest'
import { render } from '@testing-library/react'
import { Presentation, type SceneProps, type Step } from '../../src/presentation-kit'

interface Payload {
  label: string
}

function Typed({ payload }: SceneProps<Payload>) {
  return <p data-testid="typed">{payload.label}</p>
}

const steps: Step<Payload>[] = [
  { id: 'a', era: 'e', title: 'A', caption: 'a', Scene: Typed, payload: { label: 'first' }, groupKey: 'g' },
  { id: 'b', era: 'e', title: 'B', caption: 'b', Scene: Typed, payload: { label: 'second' }, groupKey: 'g' },
]

describe('typed step payloads', () => {
  it('flow through the Presentation boundary without casts', () => {
    expectTypeOf(steps[0].payload).toEqualTypeOf<Payload>()
    const { getByTestId } = render(<Presentation steps={steps} title="T" />)
    expect(getByTestId('typed').textContent).toBe('first')
  })

  it('rejects a scene whose payload type does not match the step payload', () => {
    // @ts-expect-error payload must match the Scene's payload type
    const bad: Step<Payload> = { ...steps[0], payload: { label: 1 } }
    expect(bad).toBeDefined()
  })
})
