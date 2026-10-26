import { useRef } from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Stage } from './Stage'
import type { SceneProps, Step } from './types'

interface Payload {
  label: string
}

let mountCounter = 0

function makeCountingScene() {
  return function CountingScene({ payload }: SceneProps<Payload>) {
    const instanceId = useRef<number | null>(null)
    if (instanceId.current === null) {
      mountCounter += 1
      instanceId.current = mountCounter
    }
    return (
      <div data-testid="scene-instance" data-instance={instanceId.current}>
        {payload.label}
      </div>
    )
  }
}

describe('Stage', () => {
  it('updates an existing grouped scene instance in place rather than remounting it', () => {
    const SharedScene = makeCountingScene()
    const steps: Step<Payload>[] = [
      { id: 'a', era: 'e', title: 't1', caption: 'c1', payload: { label: 'first' }, Scene: SharedScene, groupKey: 'g1' },
      { id: 'b', era: 'e', title: 't2', caption: 'c2', payload: { label: 'second' }, Scene: SharedScene, groupKey: 'g1' },
    ]

    const { rerender } = render(<Stage steps={steps} activeIndex={0} />)
    const first = screen.getByTestId('scene-instance')
    const firstInstanceId = first.getAttribute('data-instance')
    expect(first).toHaveTextContent('first')

    rerender(<Stage steps={steps} activeIndex={1} />)
    const second = screen.getByTestId('scene-instance')
    expect(second.getAttribute('data-instance')).toBe(firstInstanceId)
    expect(second).toHaveTextContent('second')
  })

  it('mounts a fresh scene instance when adjacent steps do not share a group', () => {
    const SceneA = makeCountingScene()
    const SceneB = makeCountingScene()
    const steps: Step<Payload>[] = [
      { id: 'a', era: 'e', title: 't1', caption: 'c1', payload: { label: 'first' }, Scene: SceneA },
      { id: 'b', era: 'e', title: 't2', caption: 'c2', payload: { label: 'second' }, Scene: SceneB },
    ]

    const { rerender } = render(<Stage steps={steps} activeIndex={0} />)
    const first = screen.getAllByTestId('scene-instance')[0]
    const firstInstanceId = first.getAttribute('data-instance')

    rerender(<Stage steps={steps} activeIndex={1} />)
    const instances = screen.getAllByTestId('scene-instance')
    const secondPayload = instances.find((node) => node.textContent === 'second')
    expect(secondPayload?.getAttribute('data-instance')).not.toBe(firstInstanceId)
  })

  it('exposes the active step payload, index, and isActive to the Scene', () => {
    const captured: Array<{ payload: Payload; stepIndex: number; isActive: boolean }> = []
    function CapturingScene(props: SceneProps<Payload>) {
      captured.push(props)
      return <div data-testid="capturing" />
    }
    const steps: Step<Payload>[] = [
      { id: 'a', era: 'e', title: 't1', caption: 'c1', payload: { label: 'first' }, Scene: CapturingScene },
    ]

    render(<Stage steps={steps} activeIndex={0} />)
    expect(captured.at(-1)).toEqual({ payload: { label: 'first' }, stepIndex: 0, isActive: true })
  })
})
