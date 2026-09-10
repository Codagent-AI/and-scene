// @vitest-environment jsdom
import { useEffect, type ReactNode } from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { Box } from './nodes/Box'
import { Presentation } from './Presentation'
import type { SceneProps, Step } from './types'

type Payload = { message: string }

afterEach(cleanup)

function buildSteps(Scene: (props: SceneProps<Payload>) => ReactNode): Step<Payload>[] {
  return [
    {
      id: 'first',
      era: 'beginning',
      title: 'First step',
      caption: 'The first caption.',
      groupKey: 'shared-scene',
      payload: { message: 'one' },
      Scene,
    },
    {
      id: 'second',
      era: 'middle',
      title: 'Second step',
      caption: 'The second caption.',
      groupKey: 'shared-scene',
      payload: { message: 'two' },
      Scene,
    },
  ]
}

describe('Presentation', () => {
  it('accepts typed grouped payloads and updates a shared scene without remounting', () => {
    let mounts = 0
    function Scene({ payload }: SceneProps<Payload>) {
      useEffect(() => {
        mounts += 1
      }, [])
      return <output data-testid="payload">{payload.message}</output>
    }

    render(<Presentation steps={buildSteps(Scene)} title="Typed deck" />)

    expect(screen.getByTestId('payload').textContent).toBe('one')
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(screen.getByTestId('payload').textContent).toBe('two')
    expect(mounts).toBe(1)
  })

  it('clamps keyboard navigation at both ends and leaves focused controls alone', () => {
    function Scene({ payload }: SceneProps<Payload>) {
      return <div>{payload.message}</div>
    }
    render(<Presentation steps={buildSteps(Scene)} title="Navigation deck" />)

    fireEvent.keyDown(window, { key: 'ArrowLeft' })
    expect(screen.getByTestId('presentation-root').getAttribute('data-step-index')).toBe('0')

    const next = screen.getByRole('button', { name: 'Next step' })
    next.focus()
    fireEvent.keyDown(next, { key: 'ArrowRight' })
    expect(screen.getByTestId('presentation-root').getAttribute('data-step-index')).toBe('0')

    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(screen.getByTestId('presentation-root').getAttribute('data-step-index')).toBe('1')
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(screen.getByTestId('presentation-root').getAttribute('data-step-index')).toBe('1')
  })

  it('keeps a usable active step when a live step list is shortened', () => {
    function Scene({ payload }: SceneProps<Payload>) {
      return <div>{payload.message}</div>
    }
    const steps = buildSteps(Scene)
    const { rerender } = render(<Presentation steps={steps} title="Changing deck" />)

    fireEvent.click(screen.getByRole('button', { name: 'Next step' }))
    rerender(<Presentation steps={[steps[0]]} title="Changing deck" />)

    expect(screen.getByTestId('presentation-root').getAttribute('data-step-index')).toBe('0')
    expect(screen.getByText('one')).not.toBeNull()
  })

  it('retains the clamped step when a shortened live step list grows again', () => {
    function Scene({ payload }: SceneProps<Payload>) {
      return <div>{payload.message}</div>
    }
    const steps = buildSteps(Scene)
    const { rerender } = render(<Presentation steps={steps} title="Changing deck" />)

    fireEvent.click(screen.getByRole('button', { name: 'Next step' }))
    rerender(<Presentation steps={[steps[0]]} title="Changing deck" />)
    rerender(<Presentation steps={steps} title="Changing deck" />)

    expect(screen.getByTestId('presentation-root').getAttribute('data-step-index')).toBe('0')
    expect(screen.getByText('one')).not.toBeNull()
  })

  it('does not treat a touch gesture that starts on a control as slide navigation', () => {
    function Scene({ payload }: SceneProps<Payload>) {
      return <div>{payload.message}</div>
    }
    render(<Presentation steps={buildSteps(Scene)} title="Touch deck" />)

    const next = screen.getByRole('button', { name: 'Next step' })
    fireEvent.touchStart(next, { changedTouches: [{ clientX: 100 }] })
    fireEvent.touchEnd(next, { changedTouches: [{ clientX: 0 }] })

    expect(screen.getByTestId('presentation-root').getAttribute('data-step-index')).toBe('0')
  })

  it('exposes browse and present chrome while preserving the current step', () => {
    function Scene({ payload }: SceneProps<Payload>) {
      return <div>{payload.message}</div>
    }
    render(<Presentation steps={buildSteps(Scene)} title="Mode deck" />)

    fireEvent.click(screen.getByRole('button', { name: 'Next step' }))
    fireEvent.click(screen.getByRole('button', { name: 'Switch to present mode' }))

    expect(screen.getByTestId('presentation-root').getAttribute('data-presentation-mode')).toBe('present')
    expect(screen.getByTestId('presentation-root').getAttribute('data-step-index')).toBe('1')
    expect(screen.queryByText('The second caption.')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Next step' })).toBeNull()
    expect(screen.getByText('Second step')).not.toBeNull()
  })

  it('marks the current progress and table-of-contents controls semantically', () => {
    function Scene({ payload }: SceneProps<Payload>) {
      return <div>{payload.message}</div>
    }
    render(<Presentation steps={buildSteps(Scene)} title="Semantic deck" />)

    const progress = screen.getByRole('button', { name: 'Go to step 1: First step' })
    expect(progress.getAttribute('aria-current')).toBe('step')
    expect(progress.getAttribute('data-presentation-active')).toBe('true')
    const era = screen.getByRole('button', { name: 'Go to beginning' })
    expect(era.getAttribute('aria-current')).toBe('step')
    expect(era.getAttribute('data-presentation-active')).toBe('true')

    fireEvent.click(screen.getByRole('button', { name: 'Go to step 2: Second step' }))
    expect(screen.getByRole('button', { name: 'Go to middle' }).getAttribute('aria-current')).toBe('step')
  })

  it('renders style-neutral primitives and the default attribution hook', () => {
    render(
      <>
        <Box id="plain-box">Unstyled</Box>
        <Presentation steps={buildSteps(() => <div />)} title="Attribution deck" />
      </>,
    )

    expect(screen.getByText('Unstyled').hasAttribute('style')).toBe(false)
    const attribution = screen.getByRole('link', { name: 'made by and-scene' })
    expect(attribution.getAttribute('href')).toBe('https://github.com/Codagent-AI/and-scene')
    expect(attribution.getAttribute('data-presentation-attribution')).toBe('true')
    expect(screen.queryByRole('link', { name: 'and-scene' })).toBeNull()
  })
})
