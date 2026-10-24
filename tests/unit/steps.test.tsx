import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Presentation, groupByEra, stepNumber } from '../../src/presentation-kit/index.ts'
import type { SceneProps, Step } from '../../src/presentation-kit/index.ts'
import { STEPS } from '../../src/presentations/how-to-make-a-presentation/steps/index.ts'

const Dummy = ({ step }: SceneProps) => <div data-testid="scene">{step.id}</div>

function mk(id: string, era: string): Step {
  return { id, era, title: `T ${id}`, caption: `C ${id}`, payload: undefined, Scene: Dummy }
}

describe('step model', () => {
  it('every sample step carries id, era, title, caption, and a diagram state', () => {
    for (const step of STEPS) {
      expect(step.id).toBeTruthy()
      expect(step.era).toBeTruthy()
      expect(step.title).toBeTruthy()
      expect(step.caption).toBeTruthy()
      expect(typeof step.Scene).toBe('function')
      expect(step.payload).toBeDefined()
    }
    expect(new Set(STEPS.map((s) => s.id)).size).toBe(STEPS.length)
  })

  it('derives step numbers from position', () => {
    expect([0, 1, 2].map(stepNumber)).toEqual([1, 2, 3])
  })

  it('renumbers on screen after reordering without any manual numbering', () => {
    const a = mk('a', 'one')
    const b = mk('b', 'one')
    const c = mk('c', 'two')
    const { unmount } = render(<Presentation steps={[a, b, c]} title="D" />)
    expect(document.querySelector('[data-presentation-marker-number]')?.textContent).toBe('01')
    expect(screen.getByText('T a')).toBeTruthy()
    unmount()
    render(<Presentation steps={[c, a]} title="D" />)
    expect(document.querySelector('[data-presentation-marker-number]')?.textContent).toBe('01')
    expect(screen.getByText('T c')).toBeTruthy()
    expect(document.querySelector('[data-step-count]')?.getAttribute('data-step-count')).toBe('2')
  })

  it('groups consecutive steps by era with the first index of each', () => {
    const groups = groupByEra([mk('a', 'x'), mk('b', 'x'), mk('c', 'y'), mk('d', 'x')])
    expect(groups.map((g) => [g.era, g.first, g.indices])).toEqual([
      ['x', 0, [0, 1]],
      ['y', 2, [2]],
      ['x', 3, [3]],
    ])
  })
})
