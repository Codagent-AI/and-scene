import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Presentation } from '../Presentation'
import type { SceneProps, Step } from '../types'

interface CounterPayload {
  count: number
}

interface LabelPayload {
  label: string
}

function CounterScene({ payload }: SceneProps<CounterPayload>) {
  return <div data-testid="counter-scene">count:{payload.count}</div>
}

function OtherScene({ payload }: SceneProps<LabelPayload>) {
  return <div data-testid="other-scene">label:{payload.label}</div>
}

describe('typed payload boundary', () => {
  it('accepts a heterogeneous, strongly typed step array at <Presentation> with no casts', () => {
    const groupedSteps: Array<Step<CounterPayload>> = [
      {
        id: 'a',
        era: 'Intro',
        title: 'A',
        caption: 'a',
        groupKey: 'counter',
        payload: { count: 1 },
        Scene: CounterScene,
      },
      {
        id: 'b',
        era: 'Intro',
        title: 'B',
        caption: 'b',
        groupKey: 'counter',
        payload: { count: 2 },
        Scene: CounterScene,
      },
    ]
    const otherSteps: Array<Step<LabelPayload>> = [
      { id: 'c', era: 'Outro', title: 'C', caption: 'c', payload: { label: 'done' }, Scene: OtherScene },
    ]

    const steps: Step[] = [...groupedSteps, ...otherSteps]

    render(<Presentation steps={steps} title="Typed" />)
    expect(screen.getByTestId('counter-scene')).toHaveTextContent('count:1')
  })
})
