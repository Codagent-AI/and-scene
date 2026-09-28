import { describe, expect, it, vi } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import { useEffect } from 'react'
import { Stage } from '../Stage'
import type { SceneProps, Step } from '../types'

interface LabelPayload {
  label: string
}

function makeTrackedScene(onMount: () => void, onUnmount: () => void) {
  return function TrackedScene({ payload }: SceneProps<LabelPayload>) {
    useEffect(() => {
      onMount()
      return onUnmount
    }, [])
    return <div data-testid="tracked">{payload.label}</div>
  }
}

describe('grouped scene continuity', () => {
  it('keeps a grouped scene mounted across steps and only updates its payload', () => {
    const onMount = vi.fn()
    const onUnmount = vi.fn()
    const Scene = makeTrackedScene(onMount, onUnmount)
    const steps: Step[] = [
      { id: 'a', era: 'Era', title: 'A', caption: 'a', groupKey: 'group', payload: { label: 'first' }, Scene },
      { id: 'b', era: 'Era', title: 'B', caption: 'b', groupKey: 'group', payload: { label: 'second' }, Scene },
    ]

    const { rerender, getByTestId } = render(<Stage steps={steps} stepIndex={0} mode="browse" />)
    expect(getByTestId('tracked')).toHaveTextContent('first')
    expect(onMount).toHaveBeenCalledTimes(1)

    rerender(<Stage steps={steps} stepIndex={1} mode="browse" />)
    expect(getByTestId('tracked')).toHaveTextContent('second')
    expect(onMount).toHaveBeenCalledTimes(1)
    expect(onUnmount).not.toHaveBeenCalled()
  })

  it('remounts the scene when adjacent steps do not share a group', async () => {
    const onMountA = vi.fn()
    const onUnmountA = vi.fn()
    const onMountB = vi.fn()
    const SceneA = makeTrackedScene(onMountA, onUnmountA)
    const SceneB = makeTrackedScene(onMountB, vi.fn())
    const steps: Step[] = [
      { id: 'a', era: 'Era', title: 'A', caption: 'a', payload: { label: 'first' }, Scene: SceneA },
      { id: 'b', era: 'Era', title: 'B', caption: 'b', payload: { label: 'second' }, Scene: SceneB },
    ]

    const { rerender } = render(<Stage steps={steps} stepIndex={0} mode="browse" />)
    expect(onMountA).toHaveBeenCalledTimes(1)

    rerender(<Stage steps={steps} stepIndex={1} mode="browse" />)
    await waitFor(() => expect(onMountB).toHaveBeenCalledTimes(1))
    await waitFor(() => expect(onUnmountA).toHaveBeenCalledTimes(1))
  })
})
