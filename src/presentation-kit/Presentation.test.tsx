import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Presentation } from './Presentation'
import type { Step } from './types'

function Scene({ step }: { step: Step }) {
  return <div data-testid="scene">{step.title}</div>
}

const steps: Step[] = [
  {
    id: 'one',
    era: 'intro',
    title: 'First step',
    caption: 'First caption',
    Scene,
  },
  {
    id: 'two',
    era: 'intro',
    title: 'Second step',
    caption: 'Second caption',
    Scene,
  },
]

describe('Presentation chrome hooks', () => {
  it('exposes data-step-count and data-step-index on the progress chrome', () => {
    render(<Presentation steps={steps} title="Demo" initialMode="browse" />)

    const chrome = screen.getByTestId('step-progress')
    expect(chrome).toHaveAttribute('data-step-count', '2')
    expect(chrome).toHaveAttribute('data-step-index', '0')
    expect(screen.getByLabelText('Go to step 1: First step')).toHaveAttribute('aria-current', 'step')
  })

  it('derives on-screen step numbers from position', () => {
    render(<Presentation steps={steps} title="Demo" initialMode="browse" />)
    expect(screen.getAllByText('01').length).toBeGreaterThan(0)
  })

  it('accepts strongly typed step payloads at the presentation boundary', () => {
    type Payload = { count: number }
    function TypedScene({ step }: { step: Step<Payload> }) {
      return <div data-testid="typed-scene">{step.payload?.count}</div>
    }

    const typedSteps: Step<Payload>[] = [
      {
        id: 'typed',
        era: 'typed',
        title: 'Typed step',
        caption: 'Typed caption',
        payload: { count: 3 },
        Scene: TypedScene,
      },
    ]

    render(<Presentation steps={typedSteps} title="Typed demo" initialMode="browse" />)

    expect(screen.getByTestId('typed-scene')).toHaveTextContent('3')
  })
})
