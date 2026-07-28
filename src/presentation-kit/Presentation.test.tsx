import { describe, expect, it } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import { Presentation } from './Presentation'
import type { SceneProps, Step } from './types'

interface Payload {
  label: string
}

function Scene({ payload }: SceneProps<Payload>) {
  return <div data-testid="scene-content">{payload.label}</div>
}

function makeSteps(): Step<Payload>[] {
  return [
    { id: 's1', era: 'Origins', title: 'The spark', caption: 'Caption one', Scene, payload: { label: 'a' } },
    { id: 's2', era: 'Origins', title: 'The catch', caption: 'Caption two', Scene, payload: { label: 'b' } },
    { id: 's3', era: 'Growth', title: 'The scale', caption: 'Caption three', Scene, payload: { label: 'c' } },
  ]
}

function pressKey(key: string) {
  act(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }))
  })
}

describe('Presentation', () => {
  it('accepts a strongly typed step payload without casts and renders the active scene', () => {
    render(<Presentation steps={makeSteps()} title="Deck" />)
    expect(screen.getByTestId('scene-content')).toHaveTextContent('a')
  })

  it('exposes data-step-count and data-step-index hooks that advance with navigation', () => {
    const { container } = render(<Presentation steps={makeSteps()} title="Deck" initialMode="browse" />)
    const root = container.querySelector('[data-step-count]')
    expect(root).toHaveAttribute('data-step-count', '3')
    expect(root).toHaveAttribute('data-step-index', '0')

    pressKey('ArrowRight')
    expect(root).toHaveAttribute('data-step-index', '1')
  })

  it('defaults to present mode, hiding caption, toc, and prev/next', () => {
    render(<Presentation steps={makeSteps()} title="Deck" />)
    expect(screen.queryByText('Caption one')).not.toBeInTheDocument()
    expect(screen.queryByRole('navigation', { name: /table of contents/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /next/i })).not.toBeInTheDocument()
  })

  it('shows caption, toc, and prev/next in browse mode', () => {
    render(<Presentation steps={makeSteps()} title="Deck" initialMode="browse" />)
    expect(screen.getByText('Caption one')).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: /table of contents/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument()
  })

  it('toggling mode preserves the current step', () => {
    const { container } = render(<Presentation steps={makeSteps()} title="Deck" initialMode="browse" />)
    pressKey('ArrowRight')
    const root = container.querySelector('[data-step-count]')
    expect(root).toHaveAttribute('data-step-index', '1')
    pressKey('p')
    expect(root).toHaveAttribute('data-step-index', '1')
    expect(screen.queryByText('Caption two')).not.toBeInTheDocument()
  })

  it('renders the default bottom-right attribution', () => {
    render(<Presentation steps={makeSteps()} title="Deck" />)
    expect(screen.getByRole('link', { name: /made by and-scene/i })).toBeInTheDocument()
  })

  it('clamps navigation at the last step', () => {
    const { container } = render(<Presentation steps={makeSteps()} title="Deck" initialMode="browse" />)
    pressKey('ArrowRight')
    pressKey('ArrowRight')
    pressKey('ArrowRight')
    const root = container.querySelector('[data-step-count]')
    expect(root).toHaveAttribute('data-step-index', '2')
  })

  it('renders an empty root instead of crashing when there are no steps', () => {
    const { container } = render(<Presentation steps={[]} title="Empty" />)
    const root = container.querySelector('[data-presentation-root]')
    expect(root).toHaveAttribute('data-step-count', '0')
  })

})
