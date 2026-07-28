import { describe, expect, it } from 'vitest'
import { useEffect } from 'react'
import { render } from '@testing-library/react'
import { Stage } from './Stage'
import type { SceneProps, Step } from './types'

interface Payload {
  label: string
}

function makeGroupedScene(mountLog: number[]) {
  return function GroupedScene({ payload }: SceneProps<Payload>) {
    useEffect(() => {
      mountLog.push(mountLog.length)
    }, [])
    return <div data-testid="scene">{payload.label}</div>
  }
}

describe('Stage', () => {
  it('keeps the same Scene instance mounted across steps that share a groupKey', () => {
    const mountLog: number[] = []
    const GroupedScene = makeGroupedScene(mountLog)
    const steps: Step<Payload>[] = [
      { id: 'a', section: 'one', title: 'A', caption: 'a', groupKey: 'g', Scene: GroupedScene, payload: { label: 'A' } },
      { id: 'b', section: 'one', title: 'B', caption: 'b', groupKey: 'g', Scene: GroupedScene, payload: { label: 'B' } },
    ]

    const { rerender, getByTestId } = render(<Stage steps={steps} index={0} mode="present" />)
    expect(getByTestId('scene').textContent).toBe('A')

    rerender(<Stage steps={steps} index={1} mode="present" />)
    expect(getByTestId('scene').textContent).toBe('B')
    expect(mountLog.length).toBe(1)
  })

  it('remounts the Scene when navigating across a group boundary', () => {
    const mountLogA: number[] = []
    const mountLogB: number[] = []
    const SceneA = makeGroupedScene(mountLogA)
    const SceneB = makeGroupedScene(mountLogB)
    const steps: Step<Payload>[] = [
      { id: 'a', section: 'one', title: 'A', caption: 'a', groupKey: 'g1', Scene: SceneA, payload: { label: 'A' } },
      { id: 'b', section: 'two', title: 'B', caption: 'b', groupKey: 'g2', Scene: SceneB, payload: { label: 'B' } },
    ]

    const { rerender } = render(<Stage steps={steps} index={0} mode="present" />)
    expect(mountLogA.length).toBe(1)

    rerender(<Stage steps={steps} index={1} mode="present" />)
    expect(mountLogB.length).toBe(1)
  })
})

describe('Stage fixed-canvas invariant', () => {
  it('pins the design canvas against flex shrink so the composition cannot reflow', () => {
    const steps: Step<Payload>[] = [
      { id: 'a', section: 'one', title: 'A', caption: 'a', Scene: ({ payload }) => <div>{payload.label}</div>, payload: { label: 'A' } },
    ]
    const { container } = render(<Stage steps={steps} index={0} mode="browse" />)

    // `.sk-stage` is a flex container, so without an explicit flex-shrink the
    // canvas collapses below DESIGN_W on narrow viewports and the absolutely
    // positioned scene overflows it.
    const canvas = container.querySelector<HTMLElement>('[data-scene-kit="stage-canvas"]')
    expect(canvas).not.toBeNull()
    expect(canvas!.style.flexShrink).toBe('0')
  })
})
