// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useEffect } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Presentation } from './Presentation'
import type { SceneProps, Step } from './types'

interface Payload { value: string }
function Scene({ payload }: SceneProps<Payload>) { return <div>{payload.value}</div> }
const mountSpy = vi.fn()
function GroupedScene({ payload }: SceneProps<Payload>) {
  useEffect(() => { mountSpy() }, [])
  return <div>{payload.value}</div>
}
const steps: Step<Payload>[] = [
  { id: 'one', era: 'First era', title: 'First title', caption: 'First caption', Scene: GroupedScene, groupKey: 'same-scene', payload: { value: 'First scene' } },
  { id: 'two', era: 'First era', title: 'Second title', caption: 'Second caption', Scene: GroupedScene, groupKey: 'same-scene', payload: { value: 'Second scene' } },
  { id: 'three', era: 'Later era', title: 'Third title', caption: 'Third caption', Scene, payload: { value: 'Third scene' } },
]
function setViewportWide(matches: boolean) {
  vi.stubGlobal('matchMedia', vi.fn(() => ({ matches, addEventListener: vi.fn(), removeEventListener: vi.fn() })))
}

afterEach(() => { cleanup(); vi.unstubAllGlobals() })
describe('Presentation chrome', () => {
  it('accepts typed payload steps and changes modes without losing position', async () => {
    mountSpy.mockClear()
    render(<Presentation steps={steps} title="Typed presentation" />)
    expect(screen.getByText('First scene')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Go to step 2: Second title' }))
    await waitFor(() => expect(screen.getByText('Second scene')).toBeTruthy())
    expect(mountSpy).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByRole('button', { name: 'Switch to present mode' }))
    expect(screen.getByText('Second title')).toBeTruthy()
    expect(screen.queryByText('Second caption')).toBeNull()
    expect(document.querySelector('[data-step-index="1"]')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Switch to browse mode' }))
    expect(screen.getByText('Second caption')).toBeTruthy()
  })
  it('exposes active step and era semantics and default attribution without a default brand', () => {
    setViewportWide(true)
    render(<Presentation steps={steps} title="Typed presentation" />)
    const activeProgress = screen.getByRole('button', { name: 'Go to step 1: First title' })
    expect(activeProgress.getAttribute('aria-current')).toBe('step')
    expect(activeProgress.getAttribute('data-presentation-active')).toBe('true')
    expect(screen.getByRole('button', { name: 'First era' }).getAttribute('aria-current')).toBe('step')
    const attribution = screen.getByRole('link', { name: 'made by and-scene' })
    expect(attribution.getAttribute('href')).toBe('https://github.com/and-scene/and-scene')
    expect(attribution.hasAttribute('data-presentation-attribution')).toBe(true)
    expect(document.querySelector('[data-presentation-brand]')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Later era' }))
    expect(document.querySelector('[data-step-index="2"]')).toBeTruthy()
  })
  it('mounts an ungrouped next step while the previous step exits', () => {
    render(<Presentation steps={steps} title="Typed presentation" />)
    fireEvent.click(screen.getByRole('button', { name: 'Go to step 3: Third title' }))
    expect(screen.getByText('Third scene')).toBeTruthy()
    expect(screen.getByText('First scene')).toBeTruthy()
  })
  it('shows the table of contents only on wide viewports', () => {
    setViewportWide(false)
    render(<Presentation steps={steps} title="Typed presentation" />)
    expect(screen.queryByRole('navigation', { name: 'Presentation sections' })).toBeNull()
    cleanup()
    setViewportWide(true)
    render(<Presentation steps={steps} title="Typed presentation" />)
    expect(screen.getByRole('navigation', { name: 'Presentation sections' })).toBeTruthy()
  })
})
