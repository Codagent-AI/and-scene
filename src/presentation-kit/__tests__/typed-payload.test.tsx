import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Presentation } from '../Presentation'
import type { AnyStep, SceneProps, Step } from '../types'

interface CounterPayload {
  count: number
  label: string
}

function CounterScene({ payload }: SceneProps<CounterPayload>) {
  // No cast is needed to reach `payload.count`/`payload.label` here: the
  // Step<CounterPayload> below carries that type all the way to this Scene.
  return <div data-testid="counter-scene">{`${payload.label}:${payload.count}`}</div>
}

function makeCounterStep(overrides: Partial<Step<CounterPayload>> & { id: string }): Step<CounterPayload> {
  return {
    era: 'counting',
    title: 'Counter',
    caption: 'A typed payload example.',
    Scene: CounterScene,
    payload: { count: 0, label: 'n' },
    ...overrides,
  }
}

describe('typed payload boundary', () => {
  it('carries a strongly typed grouped payload to the Presentation boundary without casts', () => {
    const steps: AnyStep[] = [
      makeCounterStep({ id: 'a', payload: { count: 1, label: 'first' } }),
      makeCounterStep({ id: 'b', payload: { count: 2, label: 'second' } }),
    ]

    render(<Presentation steps={steps} title="Typed" />)

    expect(screen.getByTestId('counter-scene')).toHaveTextContent('first:1')
  })
})
