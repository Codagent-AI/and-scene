import { describe, expect, it } from 'vitest'
import { useEffect } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Presentation } from './Presentation'
import type { SceneProps, Step } from './types'

interface TalkPayload {
  headline: string
}

function TalkScene({ payload }: SceneProps<TalkPayload>) {
  return <div data-testid="scene-payload">{payload.headline}</div>
}

function buildSteps(): Step<TalkPayload>[] {
  return [
    { id: 's1', section: 'Intro', title: 'Step one', caption: 'Caption one.', Scene: TalkScene, payload: { headline: 'one' } },
    { id: 's2', section: 'Intro', title: 'Step two', caption: 'Caption two.', Scene: TalkScene, payload: { headline: 'two' } },
    { id: 's3', section: 'Middle', title: 'Step three', caption: 'Caption three.', Scene: TalkScene, payload: { headline: 'three' } },
  ]
}

describe('Presentation', () => {
  it('accepts a strongly typed step array without casts at the boundary (typed payload boundary)', () => {
    const steps = buildSteps()
    render(<Presentation<TalkPayload> steps={steps} title="A talk" />)
    expect(screen.getByTestId('scene-payload').textContent).toBe('one')
  })

  it('fails with a named error rather than a TypeError when given no steps', () => {
    expect(() => render(<Presentation<TalkPayload> steps={[]} title="A talk" />)).toThrow(
      /at least one step/i,
    )
  })

  it('exposes data-step-count and data-step-index for external verification', () => {
    const { container } = render(<Presentation steps={buildSteps()} title="A talk" />)
    const root = container.querySelector('[data-scene-kit="presentation"]')
    expect(root).toHaveAttribute('data-step-count', '3')
    expect(root).toHaveAttribute('data-step-index', '0')
  })

  it('renders no inline color/font/border/shadow defaults on kit chrome (style ownership boundary)', () => {
    const { container } = render(<Presentation steps={buildSteps()} title="A talk" initialMode="browse" />)
    for (const el of container.querySelectorAll('[data-scene-kit]')) {
      const style = (el as HTMLElement).style
      expect(style.color).toBe('')
      expect(style.backgroundColor).toBe('')
      expect(style.fontFamily).toBe('')
      expect(style.boxShadow).toBe('')
    }
  })

  it('shows the default bottom-right and-scene attribution with a stable hook, and no top-left brand', () => {
    const { container } = render(<Presentation steps={buildSteps()} title="A talk" />)
    expect(screen.getByText('made by and-scene')).toBeInTheDocument()
    expect(container.querySelector('[data-scene-kit="brand-slot"]')?.textContent).toBe('')
  })

  it('present mode hides caption, ToC, and prev/next while showing marker + title', () => {
    render(<Presentation steps={buildSteps()} title="A talk" initialMode="present" />)
    expect(screen.getByText('Step one')).toBeInTheDocument()
    expect(screen.queryByText('Caption one.')).toBeNull()
    expect(screen.queryByRole('navigation', { name: 'Table of contents' })).toBeNull()
    expect(screen.queryByText('Prev')).toBeNull()
    expect(screen.queryByText('Next')).toBeNull()
  })

  it('browse mode shows title, caption, ToC, prev/next, and progress', () => {
    render(<Presentation steps={buildSteps()} title="A talk" initialMode="browse" />)
    expect(screen.getByText('Step one')).toBeInTheDocument()
    expect(screen.getByText('Caption one.')).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Table of contents' })).toBeInTheDocument()
    expect(screen.getByText('Prev')).toBeInTheDocument()
    expect(screen.getByText('Next')).toBeInTheDocument()
  })

  it('toggling mode with the P key preserves the current step', async () => {
    const user = userEvent.setup()
    render(<Presentation steps={buildSteps()} title="A talk" initialMode="present" />)

    await user.keyboard('{ArrowRight}')
    expect(screen.getByText('Step two')).toBeInTheDocument()

    await user.keyboard('p')
    expect(screen.getByText('Step two')).toBeInTheDocument()
    expect(screen.getByText('Caption two.')).toBeInTheDocument()
  })

  it('clamps navigation at both ends with no wrap-around', async () => {
    const user = userEvent.setup()
    const { container } = render(<Presentation steps={buildSteps()} title="A talk" initialMode="browse" />)

    await user.click(screen.getByText('Prev'))
    expect(container.querySelector('[data-scene-kit="presentation"]')).toHaveAttribute('data-step-index', '0')

    await user.click(screen.getByText('Next'))
    await user.click(screen.getByText('Next'))
    await user.click(screen.getByText('Next'))
    expect(container.querySelector('[data-scene-kit="presentation"]')).toHaveAttribute('data-step-index', '2')
  })

  it('progress indicators and ToC entries expose active navigation state for the current step', async () => {
    const user = userEvent.setup()
    const { container } = render(<Presentation steps={buildSteps()} title="A talk" initialMode="browse" />)

    await user.click(screen.getByText('Next'))
    const dots = container.querySelectorAll('[data-scene-kit="progress-dot"]')
    expect(dots[1].getAttribute('data-active')).toBe('true')
    expect(dots[0].getAttribute('data-active')).toBe('false')

    const tocEntries = container.querySelectorAll('[data-scene-kit="toc-entry"]')
    expect(tocEntries[0].getAttribute('data-active')).toBe('true')
  })

  it('jumping via a ToC entry moves to the first step of that section', async () => {
    const user = userEvent.setup()
    const { container } = render(<Presentation steps={buildSteps()} title="A talk" initialMode="browse" />)

    const middleEntry = screen.getByText('Middle')
    await user.click(middleEntry)
    expect(container.querySelector('[data-scene-kit="presentation"]')).toHaveAttribute('data-step-index', '2')
  })

  it('keeps the same Scene instance mounted while navigating within a grouped scene', async () => {
    const user = userEvent.setup()
    let mounts = 0
    function GroupedScene({ payload }: SceneProps<TalkPayload>) {
      useEffect(() => {
        mounts += 1
      }, [])
      return <div data-testid="grouped">{payload.headline}</div>
    }
    const steps: Step<TalkPayload>[] = [
      { id: 'g1', section: 'Intro', title: 'G1', caption: 'c1', groupKey: 'g', Scene: GroupedScene, payload: { headline: 'g-one' } },
      { id: 'g2', section: 'Intro', title: 'G2', caption: 'c2', groupKey: 'g', Scene: GroupedScene, payload: { headline: 'g-two' } },
    ]
    render(<Presentation steps={steps} title="A talk" initialMode="browse" />)
    expect(screen.getByTestId('grouped').textContent).toBe('g-one')

    await user.click(screen.getByText('Next'))
    expect(screen.getByTestId('grouped').textContent).toBe('g-two')
    expect(mounts).toBe(1)
  })
})
