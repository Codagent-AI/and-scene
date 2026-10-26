import { useEffect } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Stage } from './Stage'
import type { SceneProps, Step } from './types'

function makeGroupedScene(mountSpy: () => void) {
  return function GroupedScene({ payload }: SceneProps<{ label: string }>) {
    useEffect(() => {
      mountSpy()
    }, [])
    return <div data-testid="scene-content">{payload.label}</div>
  }
}

function makeStandaloneScene(mountSpy: () => void, label: string) {
  return function StandaloneScene() {
    useEffect(() => {
      mountSpy()
    }, [])
    return <div data-testid="scene-content">{label}</div>
  }
}

describe('Stage', () => {
  it('renders the active step scene with its typed payload', () => {
    const Scene = makeGroupedScene(() => {})
    const steps: Step<{ label: string }>[] = [
      { id: 's1', era: 'a', title: 't1', caption: 'c1', Scene, payload: { label: 'first' } },
    ]
    render(<Stage steps={steps} activeIndex={0} mode="browse" />)
    expect(screen.getByTestId('scene-content')).toHaveTextContent('first')
  })

  it('keeps grouped steps mounted in place instead of remounting the scene', () => {
    const mountSpy = vi.fn()
    const Scene = makeGroupedScene(mountSpy)
    const steps: Step<{ label: string }>[] = [
      { id: 's1', era: 'a', title: 't1', caption: 'c1', Scene, payload: { label: 'first' }, groupKey: 'g1' },
      { id: 's2', era: 'a', title: 't2', caption: 'c2', Scene, payload: { label: 'second' }, groupKey: 'g1' },
    ]
    const { rerender } = render(<Stage steps={steps} activeIndex={0} mode="browse" />)
    expect(mountSpy).toHaveBeenCalledTimes(1)
    expect(screen.getByTestId('scene-content')).toHaveTextContent('first')

    rerender(<Stage steps={steps} activeIndex={1} mode="browse" />)
    expect(mountSpy).toHaveBeenCalledTimes(1)
    expect(screen.getByTestId('scene-content')).toHaveTextContent('second')
  })

  it('remounts the scene when moving to a step outside the current group', () => {
    const mountSpyA = vi.fn()
    const mountSpyB = vi.fn()
    const SceneA = makeStandaloneScene(mountSpyA, 'scene a')
    const SceneB = makeStandaloneScene(mountSpyB, 'scene b')
    const steps: Step<undefined>[] = [
      { id: 's1', era: 'a', title: 't1', caption: 'c1', Scene: SceneA, payload: undefined },
      { id: 's2', era: 'b', title: 't2', caption: 'c2', Scene: SceneB, payload: undefined },
    ]
    const { rerender } = render(<Stage steps={steps} activeIndex={0} mode="browse" />)
    expect(mountSpyA).toHaveBeenCalledTimes(1)

    rerender(<Stage steps={steps} activeIndex={1} mode="browse" />)
    expect(mountSpyB).toHaveBeenCalledTimes(1)
  })
})
