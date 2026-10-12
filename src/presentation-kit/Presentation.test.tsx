import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useEffect } from 'react'
import { Presentation } from './Presentation'
import { Box } from './nodes/Box'
import type { Step } from './types'
import { calculateFitScale } from './useFitScale'
import { resolvePresentation } from '../presentations'

interface Payload { count: number }
let mounted = 0
function TypedScene({ payload }: { payload: Payload }) {
  useEffect(() => { mounted += 1 }, [])
  return <div><span>{payload.count}</span><Box id="shared">node</Box></div>
}
const steps: Step<Payload>[] = [
  { id: 'a', era: 'Start', title: 'One', caption: 'First caption', Scene: TypedScene, payload: { count: 1 }, groupKey: 'same' },
  { id: 'b', era: 'Start', title: 'Two', caption: 'Second caption', Scene: TypedScene, payload: { count: 2 }, groupKey: 'same' },
  { id: 'c', era: 'End', title: 'Three', caption: 'Third caption', Scene: TypedScene, payload: { count: 3 } },
]

describe('presentation kit', () => {
  it('derives step numbers from order after inserting, removing, and reordering', () => {
    const numbered = (items: readonly Step<Payload>[]) => items.map((step, index) => `${index + 1}:${step.id}`)
    expect(numbered(steps)).toEqual(['1:a', '2:b', '3:c'])
    expect(numbered([steps[0], { ...steps[0], id: 'x' }, steps[1]])).toEqual(['1:a', '2:x', '3:b'])
    expect(numbered([steps[2], steps[0]])).toEqual(['1:c', '2:a'])
  })

  it('accepts typed grouped steps through Presentation without casts', () => {
    const typed: Step<Payload>[] = steps
    const view = render(<Presentation steps={typed} title="Typed" />)
    expect(view.container.querySelector('[data-step-count="3"]')).toBeTruthy()
  })

  it('preserves grouped scene instances and remounts ungrouped steps', async () => {
    mounted = 0
    render(<Presentation steps={steps} title="Test" />)
    expect(mounted).toBeGreaterThan(0)
    const initialMounts = mounted
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    await waitFor(() => expect(screen.getByText('2', { selector: 'span' })).toBeTruthy())
    expect(mounted).toBe(initialMounts)
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    await waitFor(() => expect(document.querySelector('[data-step-index]')?.getAttribute('data-step-index')).toBe('2'))
    await waitFor(() => expect(mounted).toBeGreaterThan(initialMounts))
  })

  it('clamps navigation, maps keys, and toggles mode in place', () => {
    render(<Presentation steps={steps} title="Test" />)
    const root = document.querySelector('[data-step-index]')!
    fireEvent.keyDown(window, { key: 'ArrowLeft' })
    expect(root.getAttribute('data-step-index')).toBe('0')
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(root.getAttribute('data-step-index')).toBe('1')
    fireEvent.keyDown(window, { key: ' ' })
    expect(root.getAttribute('data-step-index')).toBe('2')
    fireEvent.keyDown(window, { key: 'PageDown' })
    expect(root.getAttribute('data-step-index')).toBe('2')
    fireEvent.keyDown(window, { key: 'p' })
    expect(root.getAttribute('data-presentation-mode')).toBe('present')
    expect(root.getAttribute('data-step-index')).toBe('2')
    expect(screen.queryByRole('button', { name: 'Next' })).toBeNull()
    expect(document.querySelector('[data-presentation-title]')?.textContent).toBe('Three')
    expect(document.querySelector('[data-presentation-caption]')).toBeNull()
    expect(document.querySelector('[data-presentation-toc]')).toBeNull()
    fireEvent.keyDown(window, { key: 'p' })
    const next = screen.getByRole('button', { name: 'Next' })
    next.focus()
    fireEvent.keyDown(next, { key: 'ArrowRight' })
    expect(root.getAttribute('data-step-index')).toBe('2')
    fireEvent.keyDown(next, { key: 'p' })
    expect(root.getAttribute('data-presentation-mode')).toBe('present')
    fireEvent.keyDown(next, { key: ' ' })
    expect(root.getAttribute('data-step-index')).toBe('2')
    fireEvent.keyDown(window, { key: 'PageUp' })
    expect(root.getAttribute('data-step-index')).toBe('1')
  })

  it('preserves navigation keys unless the focused widget consumes them', () => {
    render(<Presentation steps={steps} title="Test" />)
    const root = document.querySelector('[data-step-index]')!
    const next = screen.getByRole('button', { name: 'Next' })
    next.focus()
    fireEvent.keyDown(next, { key: 'ArrowRight' })
    expect(root.getAttribute('data-step-index')).toBe('1')
    fireEvent.keyDown(next, { key: 'PageUp' })
    expect(root.getAttribute('data-step-index')).toBe('0')
    fireEvent.keyDown(next, { key: ' ' })
    expect(root.getAttribute('data-step-index')).toBe('0')

    const entry = document.createElement('input')
    document.body.append(entry)
    fireEvent.keyDown(entry, { key: 'ArrowRight' })
    expect(root.getAttribute('data-step-index')).toBe('0')
    entry.remove()

    const slider = document.createElement('div')
    slider.setAttribute('role', 'slider')
    slider.tabIndex = 0
    document.body.append(slider)
    slider.focus()
    fireEvent.keyDown(slider, { key: 'ArrowRight' })
    expect(root.getAttribute('data-step-index')).toBe('0')
    slider.remove()

    const tablist = document.createElement('div')
    tablist.setAttribute('role', 'tablist')
    const tab = document.createElement('button')
    tab.setAttribute('role', 'tab')
    tab.tabIndex = 0
    tablist.append(tab)
    document.body.append(tablist)
    tab.focus()
    fireEvent.keyDown(tab, { key: 'ArrowRight' })
    expect(root.getAttribute('data-step-index')).toBe('0')
    tablist.remove()

    const region = document.createElement('div')
    region.setAttribute('role', 'region')
    const nestedButton = document.createElement('button')
    region.append(nestedButton)
    document.body.append(region)
    nestedButton.focus()
    fireEvent.keyDown(nestedButton, { key: 'ArrowRight' })
    expect(root.getAttribute('data-step-index')).toBe('1')
    region.remove()

    const attribution = screen.getByRole('link', { name: 'made by and-scene' })
    attribution.focus()
    fireEvent.keyDown(attribution, { key: 'ArrowRight' })
    expect(root.getAttribute('data-step-index')).toBe('2')
  })

  it('jumps from progress and TOC to the first step in an era with active semantics', () => {
    render(<Presentation steps={steps} title="Test" />)
    fireEvent.click(screen.getByRole('button', { name: 'Go to step 3' }))
    expect(document.querySelector('[data-step-index]')?.getAttribute('data-step-index')).toBe('2')
    fireEvent.click(screen.getByRole('button', { name: 'Start' }))
    expect(document.querySelector('[data-step-index]')?.getAttribute('data-step-index')).toBe('0')
    expect(document.querySelectorAll('[data-presentation-progress-item][aria-current="step"]')).toHaveLength(1)
    expect(document.querySelectorAll('[data-presentation-progress-item][data-presentation-active="true"]')).toHaveLength(1)
    expect(document.querySelectorAll('[data-presentation-toc-item][aria-current="step"]')).toHaveLength(1)
    expect(document.querySelectorAll('[data-presentation-toc-item][data-presentation-active="true"]')).toHaveLength(1)
  })

  it('maps left and right touch swipes to next and previous', () => {
    render(<Presentation steps={steps} title="Test" />)
    const root = document.querySelector('[data-step-index]')!
    fireEvent.touchStart(root, { touches: [{ clientX: 240, clientY: 30 }] })
    fireEvent.touchEnd(root, { changedTouches: [{ clientX: 160, clientY: 32 }] })
    expect(root.getAttribute('data-step-index')).toBe('1')
    fireEvent.touchStart(root, { touches: [{ clientX: 160, clientY: 32 }] })
    fireEvent.touchEnd(root, { changedTouches: [{ clientX: 250, clientY: 31 }] })
    expect(root.getAttribute('data-step-index')).toBe('0')
  })

  it('renders default attribution and primitive hooks without inline visual defaults', () => {
    const { container } = render(<Presentation steps={steps} title="Test" />)
    const attribution = screen.getByRole('link', { name: 'made by and-scene' })
    expect(attribution.getAttribute('href')).toBe('https://github.com/Codagent-AI/and-scene')
    expect(attribution.hasAttribute('data-presentation-attribution')).toBe(true)
    expect(container.querySelector('header a')).toBeNull()
    const node = container.querySelector('[data-presentation-node="shared"]') as HTMLElement
    expect(node).toBeTruthy()
    expect(node.style.color).toBe('')
    expect(node.style.border).toBe('')
  })

  it('calculates uniform canvas fit at the default dimensions', () => {
    expect(calculateFitScale(976, 664, 'present')).toBe(1)
    expect(calculateFitScale(488, 400, 'present')).toBeCloseTo(0.44545, 4)
    expect(calculateFitScale(400, 140, 'browse')).toBeCloseTo(0.305, 3)
  })

  it('keeps the active step valid when the supplied step list shrinks', () => {
    const view = render(<Presentation steps={steps} title="Test" />)
    fireEvent.click(screen.getByRole('button', { name: 'Go to step 3' }))
    view.rerender(<Presentation steps={steps.slice(0, 2)} title="Test" />)
    expect(document.querySelector('[data-step-index]')?.getAttribute('data-step-index')).toBe('1')
    expect(document.querySelector('[data-presentation-marker]')?.textContent).toContain('02')
    fireEvent.keyDown(window, { key: 'ArrowLeft' })
    expect(document.querySelector('[data-step-index]')?.getAttribute('data-step-index')).toBe('0')
  })

  it('resolves registered routes and falls back for unknown paths', () => {
    const entries = [{ slug: 'sample', title: 'Sample', load: async () => ({ default: () => null }) }]
    expect(resolvePresentation('/sample/', entries)?.title).toBe('Sample')
    expect(resolvePresentation('/unknown', entries)).toBeUndefined()
    expect(resolvePresentation('/', entries)).toBeUndefined()
  })
})
