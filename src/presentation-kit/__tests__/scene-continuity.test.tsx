import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useEffect } from 'react'
import { Presentation } from '../Presentation'
import type { AnyStep, SceneProps } from '../types'

const mountCounts: Record<string, number> = { grouped: 0, solo: 0 }

function GroupedScene({ payload }: SceneProps<{ value: number }>) {
  useEffect(() => {
    mountCounts.grouped += 1
  }, [])
  return <div data-testid="grouped-scene">{payload.value}</div>
}

function SoloScene() {
  useEffect(() => {
    mountCounts.solo += 1
  }, [])
  return <div data-testid="solo-scene">solo</div>
}

const steps: AnyStep[] = [
  {
    id: 'g1',
    groupKey: 'group',
    era: 'era-1',
    title: 'Grouped 1',
    caption: 'First grouped state.',
    payload: { value: 1 },
    Scene: GroupedScene,
  },
  {
    id: 'g2',
    groupKey: 'group',
    era: 'era-1',
    title: 'Grouped 2',
    caption: 'Second grouped state.',
    payload: { value: 2 },
    Scene: GroupedScene,
  },
  {
    id: 's1',
    era: 'era-2',
    title: 'Solo',
    caption: 'An ungrouped step.',
    payload: undefined,
    Scene: SoloScene,
  },
]

describe('scene continuity', () => {
  it('updates a grouped scene in place instead of remounting it', async () => {
    mountCounts.grouped = 0
    mountCounts.solo = 0
    const user = userEvent.setup()
    const { getByTestId } = render(<Presentation steps={steps} title="Continuity" />)

    expect(getByTestId('grouped-scene')).toHaveTextContent('1')
    expect(mountCounts.grouped).toBe(1)

    await user.keyboard('{ArrowRight}')

    expect(getByTestId('grouped-scene')).toHaveTextContent('2')
    expect(mountCounts.grouped).toBe(1)
  })

  it('mounts a new scene instance when the group changes', async () => {
    mountCounts.grouped = 0
    mountCounts.solo = 0
    const user = userEvent.setup()
    const { getByTestId } = render(<Presentation steps={steps} title="Continuity" />)

    await user.keyboard('{ArrowRight}{ArrowRight}')

    expect(getByTestId('solo-scene')).toBeInTheDocument()
    expect(mountCounts.solo).toBe(1)
  })
})
