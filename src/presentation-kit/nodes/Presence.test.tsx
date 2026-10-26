import { describe, expect, it } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { Stage } from '../Stage'
import { Presence } from './Presence'
import type { SceneProps, Step } from '../types'

interface Payload {
  step: number
}

function makeGroupedSteps(Scene: (props: SceneProps<Payload>) => React.ReactNode): Step<Payload>[] {
  return [
    { id: 's1', era: 'a', title: 't1', caption: 'c1', Scene, payload: { step: 1 }, groupKey: 'g' },
    { id: 's2', era: 'a', title: 't2', caption: 'c2', Scene, payload: { step: 2 }, groupKey: 'g' },
  ]
}

describe('departing entities inside a persisting grouped scene', () => {
  // The scene instance persists across grouped steps, so Stage's own
  // AnimatePresence never sees an entity that is removed *within* the scene.
  // Rendering it conditionally therefore unmounts it synchronously and its exit
  // transition never runs.
  it('a plainly conditional entity is gone the moment the step advances', () => {
    const steps = makeGroupedSteps(({ payload }) =>
      payload.step === 1 ? <span>departing entity</span> : null,
    )

    const { rerender } = render(<Stage steps={steps} activeIndex={0} mode="browse" />)
    expect(screen.getByText('departing entity')).toBeInTheDocument()

    rerender(<Stage steps={steps} activeIndex={1} mode="browse" />)
    expect(screen.queryByText('departing entity')).not.toBeInTheDocument()
  })

  it('Presence keeps a departing entity mounted through its exit transition', async () => {
    const steps = makeGroupedSteps(({ payload }) => (
      <Presence present={payload.step === 1}>
        <span>departing entity</span>
      </Presence>
    ))

    const { rerender } = render(<Stage steps={steps} activeIndex={0} mode="browse" />)
    expect(screen.getByText('departing entity')).toBeInTheDocument()

    rerender(<Stage steps={steps} activeIndex={1} mode="browse" />)
    expect(
      screen.getByText('departing entity'),
      'the entity should still be on screen while it animates out',
    ).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.queryByText('departing entity')).not.toBeInTheDocument()
    })
  })

  it('exposes a stable hook and no visual defaults', () => {
    render(
      <Presence present data-testid="presence">
        <span>entity</span>
      </Presence>,
    )
    const node = screen.getByTestId('presence')
    expect(node).toHaveAttribute('data-presentation-node', 'presence')
    for (const prop of ['color', 'backgroundColor', 'background', 'border', 'boxShadow', 'fontFamily']) {
      expect(node.style[prop as never]).toBe('')
    }
  })
})
