import { describe, expect, it } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import { useEffect } from 'react'
import { Presentation, type SceneProps, type Step } from '../../src/presentation-kit'
import { SampleScene } from '../../src/presentations/how-to-make-a-presentation/SampleScene'
import { fireEvent } from '@testing-library/react'

let mounts = 0
function Counting({ payload }: SceneProps<{ n: number }>) {
  useEffect(() => {
    mounts++
  }, [])
  return <p data-testid="payload">{payload.n}</p>
}
function Other({ payload }: SceneProps<{ n: number }>) {
  return <p data-testid="other">{payload.n}</p>
}

const grouped: Step<{ n: number }>[] = [1, 2, 3].map((n) => ({
  id: `g${n}`, era: 'e', title: `T${n}`, caption: `c${n}`, Scene: Counting, payload: { n }, groupKey: 'grp',
}))

describe('grouped scenes', () => {
  it('update the existing scene instance in place when navigating within a group', () => {
    mounts = 0
    const { container, getByTestId } = render(<Presentation steps={grouped} title="T" />)
    const node = getByTestId('payload')
    fireEvent.click(container.querySelector('[data-presentation-next]')!)
    expect(getByTestId('payload')).toBe(node)
    expect(getByTestId('payload').textContent).toBe('2')
    fireEvent.click(container.querySelector('[data-presentation-next]')!)
    expect(getByTestId('payload').textContent).toBe('3')
    expect(mounts).toBe(1)
  })

  it('swaps scenes when the group or component differs', () => {
    const steps: Step<{ n: number }>[] = [
      { ...grouped[0] },
      { ...grouped[1], Scene: Other, groupKey: 'other' },
    ]
    const { container, queryByTestId } = render(<Presentation steps={steps} title="T" />)
    expect(queryByTestId('payload')).not.toBeNull()
    fireEvent.click(container.querySelector('[data-presentation-next]')!)
    expect(queryByTestId('other')).not.toBeNull()
  })
})

describe('sample scene entity continuity', () => {
  const entity = (c: HTMLElement, id: string) => c.querySelector(`[data-presentation-entity="${id}"]`)

  it('keeps continuing entities as the same DOM nodes and adds newcomers', async () => {
    const { container, rerender } = render(<SampleScene payload={{ step: 3 }} stepIndex={2} />)
    const card = entity(container, 'card-1')
    const wrapper = card!.closest('[data-presentation-appear]') as HTMLElement
    expect(entity(container, 'card-2')).toBeNull()
    await waitFor(() => expect(wrapper.style.opacity).toBe('1'), { timeout: 3000 })
    rerender(<SampleScene payload={{ step: 4 }} stepIndex={3} />)
    expect(entity(container, 'card-1')).toBe(card)
    expect(entity(container, 'card-2')).not.toBeNull()
    // a continuing entity is not re-faded as a newcomer
    expect(wrapper.style.opacity).not.toBe('0')
  })
})
