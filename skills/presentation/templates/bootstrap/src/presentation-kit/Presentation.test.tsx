import { act, render, screen, waitFor } from '@testing-library/react'
import { useState } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { Presentation } from './Presentation'
import { AND_SCENE_REPO_URL } from './chrome/Footer'
import type { SceneProps, Step } from './types'

interface GroupedPayload {
  label: string
  count: number
}

function GroupedScene({ payload, isActive }: SceneProps<GroupedPayload>) {
  return (
    <div data-testid="grouped-scene" data-active={isActive}>
      {payload.label}: {payload.count}
    </div>
  )
}

function SoloScene({ payload }: SceneProps<GroupedPayload>) {
  return <div data-testid="solo-scene">{payload.label}</div>
}

function buildSteps(): Array<Step<GroupedPayload>> {
  return [
    {
      id: 'a1',
      era: 'Intro',
      title: 'First',
      caption: 'First caption',
      groupKey: 'growth',
      Scene: GroupedScene,
      payload: { label: 'a', count: 1 },
    },
    {
      id: 'a2',
      era: 'Intro',
      title: 'Second',
      caption: 'Second caption',
      groupKey: 'growth',
      Scene: GroupedScene,
      payload: { label: 'a', count: 2 },
    },
    {
      id: 'b1',
      era: 'Reveal',
      title: 'Third',
      caption: 'Third caption',
      Scene: SoloScene,
      payload: { label: 'b', count: 0 },
    },
  ]
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('Presentation', () => {
  it('carries a strongly typed payload to the Scene without casts', () => {
    render(<Presentation steps={buildSteps()} title="Demo" />)
    expect(screen.getByTestId('grouped-scene')).toHaveTextContent('a: 1')
  })

  it('exposes data-step-count and data-step-index on the chrome root', () => {
    const { container } = render(<Presentation steps={buildSteps()} title="Demo" />)
    const root = container.querySelector('[data-presentation-root]')
    expect(root).toHaveAttribute('data-step-count', '3')
    expect(root).toHaveAttribute('data-step-index', '0')
  })

  it('updates a grouped scene in place instead of remounting it', () => {
    const { container } = render(<Presentation steps={buildSteps()} title="Demo" />)
    const canvasBefore = container.querySelector('[data-presentation-canvas]')

    act(() => {
      container.querySelector<HTMLButtonElement>('[data-presentation-next]')!.click()
    })

    const canvasAfter = container.querySelector('[data-presentation-canvas]')
    expect(canvasAfter).toBe(canvasBefore)
    expect(screen.getByTestId('grouped-scene')).toHaveTextContent('a: 2')
  })

  it('remounts the canvas when leaving a scene group', async () => {
    const { container } = render(<Presentation steps={buildSteps()} title="Demo" />)

    act(() => {
      container.querySelector<HTMLButtonElement>('[data-presentation-next]')!.click()
    })
    act(() => {
      container.querySelector<HTMLButtonElement>('[data-presentation-next]')!.click()
    })

    await waitFor(() => {
      expect(screen.getByTestId('solo-scene')).toHaveTextContent('b')
    })
    // The outgoing canvas stays mounted alongside the incoming one for the
    // duration of its own exit animation (concurrent presence keeps shared
    // layoutId entities eligible for layout projection); it is removed once
    // that exit completes.
    await waitFor(() => {
      expect(screen.queryByTestId('grouped-scene')).not.toBeInTheDocument()
    })
  })

  it('renders default bottom-right attribution with a stable hook', () => {
    const { container } = render(<Presentation steps={buildSteps()} title="Demo" />)
    const attribution = container.querySelector('[data-presentation-attribution]')
    expect(attribution).toHaveTextContent('made by and-scene')
    expect(attribution).toHaveAttribute('href', 'https://github.com/Codagent-AI/and-scene')
    expect(AND_SCENE_REPO_URL).toBe('https://github.com/Codagent-AI/and-scene')
  })

  it('does not render default top-left brand content', () => {
    const { container } = render(<Presentation steps={buildSteps()} title="Demo" />)
    const brandSlot = container.querySelector('[data-presentation-brand-slot]')
    expect(brandSlot).toBeEmptyDOMElement()
  })

  it('renders host-provided brand content in the top-left slot', () => {
    const { container } = render(
      <Presentation steps={buildSteps()} title="Demo" brand={<span>Host Brand</span>} />,
    )
    expect(container.querySelector('[data-presentation-brand-slot]')).toHaveTextContent('Host Brand')
  })

  it('marks exactly one active progress dot matching the current step', () => {
    const { container } = render(<Presentation steps={buildSteps()} title="Demo" />)
    act(() => {
      container.querySelector<HTMLButtonElement>('[data-presentation-next]')!.click()
    })
    const dots = Array.from(container.querySelectorAll('[data-presentation-progress-dot]'))
    const activeDots = dots.filter((dot) => dot.getAttribute('data-active') === 'true')
    expect(activeDots).toHaveLength(1)
    expect(dots.indexOf(activeDots[0])).toBe(1)
  })

  it('shows caption, progress, and toc in browse mode and hides them in present mode', () => {
    const { container } = render(<Presentation steps={buildSteps()} title="Demo" initialMode="browse" />)
    expect(container.querySelector('[data-presentation-caption]')).toBeInTheDocument()
    expect(container.querySelector('[data-presentation-progress]')).toBeInTheDocument()
    expect(container.querySelector('[data-presentation-toc]')).toBeInTheDocument()

    act(() => {
      container.querySelector<HTMLButtonElement>('[data-presentation-mode-toggle]')!.click()
    })

    expect(container.querySelector('[data-presentation-caption]')).not.toBeInTheDocument()
    expect(container.querySelector('[data-presentation-progress]')).not.toBeInTheDocument()
    expect(container.querySelector('[data-presentation-toc]')).not.toBeInTheDocument()
    expect(container.querySelector('[data-presentation-marker]')).toBeInTheDocument()
  })

  it('mode toggle preserves the current step', () => {
    const { container } = render(<Presentation steps={buildSteps()} title="Demo" />)
    act(() => {
      container.querySelector<HTMLButtonElement>('[data-presentation-next]')!.click()
    })
    const root = container.querySelector('[data-presentation-root]')
    expect(root).toHaveAttribute('data-step-index', '1')

    act(() => {
      container.querySelector<HTMLButtonElement>('[data-presentation-mode-toggle]')!.click()
    })

    expect(root).toHaveAttribute('data-step-index', '1')
    expect(root).toHaveAttribute('data-presentation-mode', 'present')
  })

  it('clamps navigation at the last step', () => {
    const { container } = render(<Presentation steps={buildSteps()} title="Demo" />)
    act(() => {
      const nextButton = container.querySelector<HTMLButtonElement>('[data-presentation-next]')!
      nextButton.click()
      nextButton.click()
      nextButton.click()
    })
    expect(container.querySelector('[data-presentation-root]')).toHaveAttribute('data-step-index', '2')
  })

  it('keeps the active grouped scene mounted when steps shrink below the current index', () => {
    let mounts = 0
    function StatefulScene({ payload }: SceneProps<number>) {
      const [mountId] = useState(() => ++mounts)
      return <div data-testid="stateful-scene" data-mount-id={mountId}>{payload}</div>
    }
    const makeSteps = (count: number): Array<Step<number>> =>
      Array.from({ length: count }, (_, index) => ({
        id: `s${index}`,
        era: 'Only',
        title: `Step ${index}`,
        caption: `Caption ${index}`,
        groupKey: 'shared',
        Scene: StatefulScene,
        payload: index,
      }))

    const { container, rerender } = render(<Presentation steps={makeSteps(5)} title="Demo" />)
    const nextButton = container.querySelector<HTMLButtonElement>('[data-presentation-next]')!
    act(() => {
      for (let press = 0; press < 4; press += 1) nextButton.click()
    })
    const root = container.querySelector('[data-presentation-root]')
    expect(root).toHaveAttribute('data-step-index', '4')
    const mountId = screen.getByTestId('stateful-scene').dataset.mountId

    rerender(<Presentation steps={makeSteps(2)} title="Demo" />)

    expect(container.querySelector('[data-presentation-empty]')).toBeNull()
    expect(container.querySelector('[data-presentation-root]')).toHaveAttribute('data-step-index', '1')
    expect(screen.getByTestId('stateful-scene').dataset.mountId).toBe(mountId)
  })
})
