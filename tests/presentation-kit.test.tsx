import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { useEffect } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Presentation, Box, type SceneProps, type Step } from '../src/presentation-kit'
import { DESIGN_H, DESIGN_W, getFitScale } from '../src/presentation-kit'
import { resolvePresentationRoute, type PresentationRegistryEntry } from '../src/presentations'

afterEach(() => { cleanup(); vi.restoreAllMocks(); mounts.mockClear() })

interface Payload { value: number }
const mounts = vi.fn()
function Scene({ payload }: SceneProps<Payload>) {
  useEffect(() => { mounts(); return () => mounts() }, [])
  return <Box entityId="stable-entity">Value {payload.value}</Box>
}
const steps: Step<Payload>[] = [
  { id: 'one', era: 'Start', title: 'First', caption: 'First caption', groupKey: 'story', Scene, payload: { value: 1 } },
  { id: 'two', era: 'Middle', title: 'Second', caption: 'Second caption', groupKey: 'story', Scene, payload: { value: 2 } },
]

describe('presentation scene kit', () => {
  it('accepts strongly typed grouped payloads and preserves the scene instance across group steps', async () => {
    const { container } = render(<Presentation steps={steps} title="Typed" />)
    expect(screen.getByText('Value 1')).toBeTruthy()
    expect(container.querySelector('[data-step-count="2"]')?.getAttribute('data-step-index')).toBe('0')
    fireEvent.click(screen.getByRole('button', { name: 'Next step' }))
    expect(await screen.findByText('Value 2')).toBeTruthy()
    expect(mounts).toHaveBeenCalledTimes(1)
    expect(container.querySelector('[data-presentation-node="presentation-box"]')?.getAttribute('data-entity-id')).toBe('stable-entity')
  })

  it('exposes default attribution and semantic active progress and section states', () => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1200 })
    render(<Presentation steps={steps} title="Styled by host" />)
    const attribution = screen.getByRole('link', { name: 'made by and-scene' })
    expect(attribution.getAttribute('href')).toBe('https://github.com/and-scene/and-scene')
    expect(attribution.hasAttribute('data-presentation-attribution')).toBe(true)
    expect(screen.getByRole('button', { name: 'Go to step 1: First' }).getAttribute('aria-current')).toBe('step')
    expect(screen.getByRole('button', { name: 'Start' }).getAttribute('aria-current')).toBe('location')
    expect(screen.getByRole('button', { name: 'Go to step 1: First' }).className).toContain('presentation-progress__step')
  })

  it('keeps primitive styling author-owned and fits the fixed canvas uniformly', () => {
    const { container } = render(<Box entityId="neutral">Neutral</Box>)
    const primitive = container.querySelector('[data-presentation-node="presentation-box"]') as HTMLElement
    expect(primitive.className).toContain('presentation-box')
    expect(primitive.style.color).toBe('')
    expect(primitive.style.backgroundColor).toBe('')
    expect(primitive.style.border).toBe('')
    expect([DESIGN_W, DESIGN_H]).toEqual([880, 380])
    expect(getFitScale(440, 380, 'present')).toBeCloseTo(376 / DESIGN_W)
    expect(getFitScale(880, 760, 'present')).toBeCloseTo(816 / DESIGN_W)
  })

  it('clamps navigation, ignores deck keys on controls, toggles modes without moving, and supports direct jumps', () => {
    render(<Presentation steps={steps} title="Modes" />)
    const root = document.querySelector('[data-presentation]')!
    act(() => { window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true })) })
    expect(root.getAttribute('data-step-index')).toBe('0')
    fireEvent.click(screen.getByRole('button', { name: 'Go to step 2: Second' }))
    expect(root.getAttribute('data-step-index')).toBe('1')
    fireEvent.keyDown(screen.getByRole('button', { name: 'Previous step' }), { key: 'ArrowLeft' })
    expect(root.getAttribute('data-step-index')).toBe('1')
    act(() => { window.dispatchEvent(new KeyboardEvent('keydown', { key: 'p', bubbles: true })) })
    expect(root.getAttribute('data-presentation-mode')).toBe('present')
    expect(root.getAttribute('data-step-index')).toBe('1')
    expect(screen.queryByRole('button', { name: 'Next step' })).toBeNull()
    act(() => { window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })) })
    expect(root.getAttribute('data-step-index')).toBe('1')
  })

  it('clamps the active step when steps are removed and renders an empty state for no steps', () => {
    const { rerender } = render(<Presentation steps={steps} title="Changing" />)
    fireEvent.click(screen.getByRole('button', { name: 'Go to step 2: Second' }))
    const shortened = [steps[0]]
    rerender(<Presentation steps={shortened} title="Changing" />)
    expect(document.querySelector('[data-step-index="0"]')).toBeTruthy()
    expect(screen.getByText('First')).toBeTruthy()
    rerender(<Presentation steps={[]} title="Changing" />)
    expect(screen.getByText('No steps available.')).toBeTruthy()
    expect(document.querySelector('[data-step-count="0"][data-step-index="0"]')).toBeTruthy()
  })
})

describe('pathname registry', () => {
  it('resolves root to landing and known slugs to their explicit route', () => {
    const entry = { slug: 'sample', title: 'Sample', load: async () => ({ default: (() => null) }) } satisfies PresentationRegistryEntry
    expect(resolvePresentationRoute('/', [entry])).toBeUndefined()
    expect(resolvePresentationRoute('/sample/', [entry])).toBe(entry)
    expect(resolvePresentationRoute('/missing', [entry])).toBeUndefined()
  })
})
