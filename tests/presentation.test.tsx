import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { Presentation } from '../src/presentation-kit/Presentation'
import type { SceneProps, Step } from '../src/presentation-kit/types'

let mounts = 0
function Scene({ payload }: SceneProps<{ value: string }>) {
  const [instance] = useState(() => ++mounts)
  return <div data-testid="scene" data-instance={instance}>{payload.value}</div>
}
const steps: Step<{ value: string }>[] = [
  { id: 'a', era: 'begin', title: 'First title', caption: 'First caption', Scene, groupKey: 'shared', payload: { value: 'one' } },
  { id: 'b', era: 'begin', title: 'Second title', caption: 'Second caption', Scene, groupKey: 'shared', payload: { value: 'two' } },
  { id: 'c', era: 'end', title: 'Last title', caption: 'Last caption', Scene, groupKey: 'last', payload: { value: 'three' } },
]

describe('presentation host', () => {
  it('exposes narration, order-derived markers, canvas, active hooks, and opt-in branding', () => {
    const { container } = render(<Presentation steps={steps} title="Test" />)
    expect(container.querySelector('[data-presentation-chrome]')).toHaveAttribute('data-step-count', '3')
    expect(container.querySelector('[data-presentation-marker]')).toHaveTextContent('1 / 3')
    expect(container.querySelector('[data-presentation-title]')).toHaveTextContent('First title')
    expect(container.querySelector('[data-presentation-caption]')).toHaveTextContent('First caption')
    expect(container.querySelector('[data-presentation-era]')).toHaveTextContent('begin')
    expect(container.querySelector('[data-presentation-stage]')).toHaveStyle({ width: '880px', height: '380px' })
    expect(container.querySelector('[data-presentation-brand]')).toBeEmptyDOMElement()
    expect(container.querySelector('[data-presentation-progress-item][aria-current="step"]')).toHaveAttribute('data-presentation-active', 'true')
  })

  it('updates grouped scenes in place and preserves step across mode changes', () => {
    const { container } = render(<Presentation steps={steps} title="Test" />)
    const scene = screen.getByTestId('scene')
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(screen.getByTestId('scene')).toBe(scene)
    expect(scene).toHaveTextContent('two')
    fireEvent.keyDown(window, { key: 'p' })
    expect(container.querySelector('[data-presentation-chrome]')).toHaveAttribute('data-step-index', '1')
    expect(container.querySelector('[data-presentation-chrome]')).toHaveAttribute('data-presentation-mode', 'present')
    for (const hook of ['caption', 'toc', 'prev', 'next', 'progress']) expect(container.querySelector(`[data-presentation-${hook}]`)).toBeNull()
    expect(container.querySelector('[data-presentation-title]')).toHaveTextContent('Second title')
    fireEvent.keyDown(window, { key: 'p' })
    expect(container.querySelector('[data-presentation-caption]')).toHaveTextContent('Second caption')
    expect(container.querySelector('[data-presentation-marker]')).toHaveTextContent('2 / 3')
  })

  it('supports direct jumps, first-step-of-era ToC, and boundary buttons', async () => {
    window.innerWidth = 1440; window.dispatchEvent(new Event('resize'))
    const { container } = render(<Presentation steps={steps} title="Test" />)
    expect(container.querySelector('[data-presentation-prev]')).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: 'Go to step 3: Last title' }))
    expect(container.querySelector('[data-presentation-next]')).toBeDisabled()
    expect(container.querySelector('[data-presentation-toc-item][aria-current="true"]')).toHaveTextContent('end')
    fireEvent.click(screen.getByRole('button', { name: 'begin' }))
    expect(container.querySelector('[data-presentation-chrome]')).toHaveAttribute('data-step-index', '0')
    await waitFor(() => expect(screen.getAllByTestId('scene')).toHaveLength(1))
  })

  it('remounts for a different group or scene component', async () => {
    const { rerender } = render(<Presentation steps={steps} title="Test" />)
    const instance = screen.getByTestId('scene').dataset.instance
    fireEvent.keyDown(window, { key: 'ArrowRight' }); fireEvent.keyDown(window, { key: 'ArrowRight' })
    await waitFor(() => expect(screen.getAllByTestId('scene')).toHaveLength(1))
    expect(screen.getByTestId('scene').dataset.instance).not.toBe(instance)
    function Other() { return <div>Other component</div> }
    rerender(<Presentation steps={[{ ...steps[2], Scene: Other }]} title="Test" />)
    await waitFor(() => expect(screen.getByText('Other component')).toBeInTheDocument())
  })

  it('supports attribution defaults, replacement, disabling, and host branding', () => {
    const { container, rerender } = render(<Presentation steps={steps} title="Test" />)
    expect(screen.getByRole('link', { name: 'made by and-scene' })).toHaveAttribute('href', 'https://github.com/Codagent-AI/and-scene')
    rerender(<Presentation steps={steps} title="Test" attribution={{ label: 'Custom credit', href: 'https://example.com' }} brand={<a href="/">Host</a>} />)
    expect(container.querySelector('[data-presentation-attribution]')).toHaveTextContent('Custom credit')
    expect(container.querySelector('[data-presentation-brand]')).toHaveTextContent('Host')
    rerender(<Presentation steps={steps} title="Test" attribution={false} />)
    expect(container.querySelector('[data-presentation-attribution]')).toBeNull()
  })

  it('hides ToC at narrow viewports and honors initial present mode', () => {
    window.innerWidth = 390; window.dispatchEvent(new Event('resize'))
    const { container, rerender } = render(<Presentation steps={steps} title="Test" />)
    expect(container.querySelector('[data-presentation-toc]')).toBeNull()
    rerender(<Presentation key="present" steps={steps} title="Test" initialMode="present" />)
    expect(container.querySelector('[data-presentation-chrome]')).toHaveAttribute('data-presentation-mode', 'present')
  })

  it('rejects an empty step list with a useful error', () => {
    expect(() => render(<Presentation steps={[]} title="Empty" />)).toThrow('at least one step')
  })
})
it('derives every visible step number after reordering the data', () => {
  const { container } = render(<Presentation steps={[steps[2], steps[0]]} title="Reordered" />)
  expect(container.querySelector('[data-presentation-marker]')).toHaveTextContent('1 / 2')
  expect(screen.getByRole('button', { name: 'Go to step 1: Last title' })).toHaveAttribute('aria-current', 'step')
  expect(screen.getByRole('button', { name: 'Go to step 2: First title' })).not.toHaveAttribute('data-presentation-active')
})
it('starts a new instance when adjacent steps reuse a group key with different Scene components', async () => {
  function OtherScene({ payload }: SceneProps<{ value: string }>) {
    return <div data-testid="other-scene">{payload.value}</div>
  }
  render(<Presentation steps={[steps[0], { ...steps[1], Scene: OtherScene }]} title="Component change" />)
  fireEvent.keyDown(window, { key: 'ArrowRight' })
  expect(screen.getByTestId('other-scene')).toHaveTextContent('two')
  await waitFor(() => expect(screen.queryByTestId('scene')).toBeNull())
})
