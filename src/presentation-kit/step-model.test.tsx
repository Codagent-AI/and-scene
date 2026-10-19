import { afterEach, describe, expect, it, vi } from 'vitest'

// Exit transitions run in real time; allow for parallel test load.
vi.setConfig({ testTimeout: 20000 })
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react'
import type { ComponentType } from 'react'
import { Presentation } from './Presentation'
import { Stage } from './Stage'
import type { SceneProps, Step, StepMeta } from './types'
import { OUTLINE } from '../presentations/how-to-make-a-presentation/outline'

afterEach(cleanup)

interface StateProps {
  state: string
}

const StateScene: ComponentType<SceneProps<StateProps>> = ({ payload }) => (
  <p data-testid="state">{payload.state}</p>
)

function meta(id: string): StepMeta {
  return { id, era: 'era', title: `Title ${id}`, caption: `Caption ${id}` }
}

function step(id: string, state = id): Step<StateProps> {
  return { ...meta(id), Scene: StateScene, payload: { state } }
}

function padded(position: number, count: number): string {
  return String(position + 1).padStart(String(count).length, '0')
}

function progressNumbers(container: HTMLElement): string[] {
  return Array.from(container.querySelectorAll('[data-presentation-progress-item]')).map((el) => el.textContent ?? '')
}

describe('step model: identity and required fields (L-1)', () => {
  it('sample outline rows carry non-empty id, era, title and caption with unique ids', () => {
    expect(OUTLINE.length).toBeGreaterThan(1)
    for (const row of OUTLINE) {
      for (const field of ['id', 'era', 'title', 'caption'] as const) {
        expect(row[field].trim(), `${row.id || '(no id)'}.${field}`).not.toBe('')
      }
      expect(row.title, `${row.id} title is one line`).not.toMatch(/[\r\n]/)
    }
    const ids = OUTLINE.map((row) => row.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('renders the supplied active diagram state and the presenter title and browse caption', async () => {
    const steps = [step('a', 'first-state'), step('b', 'second-state')]
    const { getByTestId, getAllByTestId, container, getByRole, rerender } = render(
      <Presentation steps={steps} title="deck" initialMode="browse" />,
    )
    expect(getByTestId('state').textContent).toBe('first-state')
    expect(getByRole('heading', { level: 1 }).textContent).toBe('Title a')
    expect(container.querySelector('[data-presentation-caption]')?.textContent).toBe('Caption a')

    fireEvent.click(container.querySelector('[data-presentation-next]') as HTMLElement)
    expect(getAllByTestId('state').map((n) => n.textContent)).toContain('second-state')
    // The departing scene stays until its exit completes, then only the active one remains.
    await waitFor(() => expect(getAllByTestId('state').map((n) => n.textContent)).toEqual(['second-state']), { timeout: 5000 })

    rerender(<Presentation steps={[step('a', 'x'), step('b', 'changed-payload')]} title="deck" initialMode="browse" />)
    expect(getByTestId('state').textContent).toBe('changed-payload')
  })

  it('Stage hands the active payload and stepIndex to the scene', () => {
    const seen: Array<{ payload: StateProps; stepIndex: number; mode: string }> = []
    const Probe: ComponentType<SceneProps<StateProps>> = (props) => {
      seen.push({ payload: props.payload, stepIndex: props.stepIndex, mode: props.mode })
      return <span data-testid="probe">{props.payload.state}</span>
    }
    const probeStep: Step<StateProps> = { ...meta('p'), Scene: Probe, payload: { state: 'supplied' } }
    const { getByTestId } = render(<Stage step={probeStep} index={3} mode="browse" />)
    expect(getByTestId('probe').textContent).toBe('supplied')
    expect(seen.at(-1)).toEqual({ payload: { state: 'supplied' }, stepIndex: 3, mode: 'browse' })
  })
})

describe('order-derived numbering (L-2)', () => {
  it('numbers rendered markers and progress items from position through insert, splice and reorder', () => {
    const ids = ['a', 'b', 'c']
    const { container, rerender, getByRole } = render(
      <Presentation steps={ids.map((id) => step(id))} title="deck" initialMode="browse" />,
    )
    const expectNumbers = (order: string[]) => {
      const count = order.length
      const numbers = Array.from({ length: count }, (_, i) => padded(i, count))
      expect(progressNumbers(container)).toEqual(numbers)
      expect(
        Array.from(container.querySelectorAll('[data-presentation-progress-item]')).map((el) =>
          el.getAttribute('aria-label'),
        ),
      ).toEqual(order.map((id, i) => `Step ${i + 1}: Title ${id}`))
      expect(container.querySelector('[data-presentation-marker]')?.textContent).toBe(numbers[0])
    }
    expectNumbers(['a', 'b', 'c'])

    // Insert a new step in the middle, keeping every stable id.
    const inserted = ['a', 'n', 'b', 'c']
    rerender(<Presentation steps={inserted.map((id) => step(id))} title="deck" initialMode="browse" />)
    expectNumbers(inserted)

    // Splice out the first step; the active marker follows the new position of index 0.
    const spliced = ['n', 'b', 'c']
    rerender(<Presentation steps={spliced.map((id) => step(id))} title="deck" initialMode="browse" />)
    expectNumbers(spliced)

    // Reorder: reversed array, numbers still count up in array order.
    const reversed = ['c', 'b', 'n']
    rerender(<Presentation steps={reversed.map((id) => step(id))} title="deck" initialMode="browse" />)
    expectNumbers(reversed)
    expect(getByRole('heading', { level: 1 }).textContent).toBe('Title c')
  })

  it('pads displayed numbers to the width of the step count', () => {
    const ids = Array.from({ length: 12 }, (_, i) => `s${i}`)
    const { container } = render(
      <Presentation steps={ids.map((id) => step(id))} title="deck" initialMode="browse" />,
    )
    const numbers = progressNumbers(container)
    expect(numbers[0]).toBe('01')
    expect(numbers[9]).toBe('10')
    expect(numbers[11]).toBe('12')
  })
})
