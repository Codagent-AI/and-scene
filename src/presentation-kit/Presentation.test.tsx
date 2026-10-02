// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useState } from 'react'
import { Presentation } from './Presentation'
import type { SceneProps, Step } from './types'

afterEach(() => { cleanup(); vi.restoreAllMocks() })

interface Payload { message: string }
function Scene({ payload }: SceneProps<Payload>) {
  const [instance] = useState(() => Math.random().toString())
  return <div data-testid="scene" data-instance={instance}><span>{payload.message}</span></div>
}
const steps: Step<Payload>[] = [
  { id: 'one', era: 'start', title: 'First', caption: 'First caption', groupKey: 'journey', Scene, payload: { message: 'typed payload one' } },
  { id: 'two', era: 'end', title: 'Second', caption: 'Second caption', groupKey: 'journey', Scene, payload: { message: 'typed payload two' } },
]

describe('Presentation scene kit', () => {
  it('passes typed payloads through the generic presentation boundary and preserves grouped scenes', () => {
    const { container } = render(<Presentation<Payload> steps={steps} title="Test" />)
    const before = screen.getByTestId('scene').getAttribute('data-instance')
    expect(screen.getByText('typed payload one')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Go to step 2: Second' }))
    expect(screen.getByText('typed payload two')).toBeTruthy()
    expect(screen.getByTestId('scene').getAttribute('data-instance')).toBe(before)
    expect(container.querySelector('[data-step-count="2"][data-step-index="1"]')).toBeTruthy()
  })

  it('exposes attribution and active navigation semantics without visual defaults', () => {
    const { container } = render(<Presentation steps={steps} title="Test" />)
    const attribution = screen.getByRole('link', { name: 'made by and-scene' })
    expect(attribution.getAttribute('href')).toBe('https://github.com/and-scene/and-scene')
    expect(attribution.hasAttribute('data-presentation-attribution')).toBe(true)
    expect(container.querySelector('[data-presentation-toc-item][data-active="true"]')?.getAttribute('aria-current')).toBe('location')
    expect(container.querySelector('[data-presentation-progress-item][data-active="true"]')?.getAttribute('aria-current')).toBe('step')
    expect(container.querySelector('[data-presentation-stage]')?.getAttribute('style')).toBeNull()
    expect(container.querySelector('.presentation-header-brand a')).toBeNull()
  })

  it('supports modes, direct navigation, and keyboard boundary clamping', async () => {
    render(<Presentation steps={steps} title="Test" />)
    fireEvent.keyDown(window, { key: 'ArrowLeft' })
    expect(screen.getByText('First caption')).toBeTruthy()
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    await waitFor(() => expect(screen.getByText('Second caption')).toBeTruthy())
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(screen.getByText('Second caption')).toBeTruthy()
    fireEvent.keyDown(window, { key: 'p' })
    expect(screen.queryByText('Second caption')).toBeNull()
    expect(screen.getByText('Test — Second')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Switch to browse mode' }))
    expect(screen.getByText('Second caption')).toBeTruthy()
  })

  it('lets focused interactive controls keep their keys instead of advancing the deck', async () => {
    const { container } = render(<Presentation steps={steps} title="Test" />)
    const control = screen.getByRole('button', { name: 'Go to step 1: First' })
    control.focus()
    for (const key of ['ArrowRight', ' ', 'PageDown', 'p']) fireEvent.keyDown(control, { key, cancelable: true })
    expect(container.querySelector('[data-step-index="0"]')).toBeTruthy()
    expect(screen.getByText('First caption')).toBeTruthy()
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    await waitFor(() => expect(container.querySelector('[data-step-index="1"]')).toBeTruthy())
    fireEvent.keyDown(window, { key: 'p', ctrlKey: true })
    expect(screen.getByText('Second caption')).toBeTruthy()
  })

  it('clamps the active step when the step list shrinks or becomes empty', () => {
    const { rerender, container } = render(<Presentation steps={steps} title="Test" />)
    fireEvent.click(screen.getByRole('button', { name: 'Go to step 2: Second' }))
    expect(container.querySelector('[data-step-index="1"]')).toBeTruthy()
    rerender(<Presentation steps={[steps[0]]} title="Test" />)
    expect(container.querySelector('[data-step-index="0"]')).toBeTruthy()
    rerender(<Presentation steps={[]} title="Test" />)
    expect(container.querySelector('[data-step-index]')).toBeNull()
    rerender(<Presentation steps={[steps[0]]} title="Test" />)
    expect(container.querySelector('[data-step-index="0"]')).toBeTruthy()
  })
})
