// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useEffect } from 'react'
import { Presentation } from './Presentation.tsx'
import { Box } from './nodes/Box.tsx'
import type { SceneProps, Step } from './types.ts'

interface Payload { label: string }
const mount = vi.fn()
function TypedScene({ payload, step }: SceneProps<Payload>) {
  useEffect(() => { mount() }, [])
  return <div data-testid="scene">{payload.label} / {step.title}<Box id="entity" data-testid="entity">{payload.label}</Box></div>
}
const steps: Step<Payload>[] = [
  { id: 'one', era: 'Start', title: 'First', caption: 'First caption', groupKey: 'story', Scene: TypedScene, payload: { label: 'one' } },
  { id: 'two', era: 'Middle', title: 'Second', caption: 'Second caption', groupKey: 'story', Scene: TypedScene, payload: { label: 'two' } },
]
const currentScene = () => screen.getAllByTestId('scene').at(-1)!

describe('Presentation scene kit contract', () => {
  beforeEach(() => {
    mount.mockClear()
    vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} })
  })
  afterEach(() => { cleanup(); vi.unstubAllGlobals() })

  it('passes strongly typed grouped payloads across the presentation boundary and keeps the scene mounted', () => {
    render(<Presentation<Payload> title="Typed" steps={steps} />)
    expect(currentScene().textContent).toContain('one / First')
    fireEvent.click(screen.getByRole('button', { name: 'Go to step 2: Second' }))
    expect(currentScene().textContent).toContain('two / Second')
    expect(mount).toHaveBeenCalledTimes(1)
  })

  it('clamps navigation at both ends and exposes semantic active controls', () => {
    render(<Presentation<Payload> title="Typed" steps={steps} />)
    expect(screen.getByRole('button', { name: 'Go to step 1: First' }).getAttribute('aria-current')).toBe('step')
    expect((screen.getByRole('button', { name: 'Previous step' }) as HTMLButtonElement).disabled).toBe(true)
    fireEvent.keyDown(window, { key: 'ArrowLeft' })
    expect(currentScene().textContent).toContain('one / First')
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(currentScene().textContent).toContain('two / Second')
    expect(screen.getByRole('button', { name: 'Go to step 2: Second' }).getAttribute('aria-current')).toBe('step')
  })

  it('switches modes without changing position and preserves keys on focused controls', () => {
    render(<Presentation<Payload> title="Typed" steps={steps} />)
    fireEvent.click(screen.getByRole('button', { name: 'Go to step 2: Second' }))
    fireEvent.click(screen.getByRole('button', { name: 'Switch to present mode' }))
    expect(currentScene().textContent).toContain('two / Second')
    expect(screen.queryByLabelText('Presentation steps')).toBeNull()
    fireEvent.keyDown(screen.getByRole('button', { name: 'Switch to browse mode' }), { key: 'ArrowLeft' })
    expect(currentScene().textContent).toContain('two / Second')
  })

  it('keeps the presentation reachable when its step list shrinks', async () => {
    const { rerender } = render(<Presentation<Payload> title="Typed" steps={steps} />)
    fireEvent.click(screen.getByRole('button', { name: 'Go to step 2: Second' }))
    rerender(<Presentation<Payload> title="Typed" steps={steps.slice(0, 1)} />)
    await waitFor(() => expect(screen.getByRole('button', { name: 'Go to step 1: First' })).toBeTruthy())
    expect(document.querySelector('[data-step-index]')?.getAttribute('data-step-index')).toBe('0')
  })

  it('renders attribution and stable primitive hooks without visual defaults', () => {
    const { getByTestId } = render(<Presentation<Payload> title="Typed" steps={steps} />)
    const attribution = screen.getByRole('link', { name: 'made by and-scene' })
    expect(attribution.getAttribute('href')).toBe('https://github.com/and-scene')
    expect(getByTestId('entity').getAttribute('data-presentation-node')).toBe('box')
    expect(getByTestId('entity').getAttribute('style')).toBeNull()
    expect(document.querySelector('[data-presentation-header-brand]')?.textContent).toBe('')
  })
})
