import { afterEach, describe, expect, it } from 'vitest'
import { useEffect } from 'react'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { Presentation } from '../src/presentation-kit/Presentation'
import { Box } from '../src/presentation-kit/nodes/Box'
import type { SceneProps, Step } from '../src/presentation-kit/types'
import { normalizeRoute } from '../src/route'

afterEach(cleanup)

interface Payload { value: number }
function Scene({ payload }: SceneProps<Payload>) { return <Box id="stable-node" className="local-style">Value {payload.value}</Box> }
const steps: Step<Payload>[] = [
  { id: 'one', era: 'Start', title: 'First', caption: 'First caption', groupKey: 'same-scene', Scene, payload: { value: 1 } },
  { id: 'two', era: 'Start', title: 'Second', caption: 'Second caption', groupKey: 'same-scene', Scene, payload: { value: 2 } },
  { id: 'three', era: 'Finish', title: 'Third', caption: 'Third caption', groupKey: 'same-scene', Scene, payload: { value: 3 } },
]

// This assignment is a compile-time contract: generic payloads pass through the host without casts.
const TypedPresentation: React.ComponentType<{ steps: readonly Step<Payload>[]; title: string }> = Presentation<Payload>

describe('presentation kit contracts', () => {
  it('accepts grouped typed payloads and preserves the scene instance while updating data', () => {
    let mounts = 0
    function PersistentScene({ payload }: SceneProps<Payload>) { useEffect(() => { mounts += 1 }, []); return <p>{payload.value}</p> }
    const grouped = steps.map((step) => ({ ...step, Scene: PersistentScene }))
    render(<TypedPresentation steps={grouped} title="Typed" />)
    expect(within(document.querySelector('[data-presentation-scene]') as HTMLElement).getByText('1')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Next step' }))
    expect(within(document.querySelector('[data-presentation-scene]') as HTMLElement).getByText('2')).toBeTruthy()
    expect(mounts).toBe(1)
    expect(document.querySelector('[data-presentation-scene]')).toBeTruthy()
  })

  it('provides attribution, active navigation semantics, and presentation-owned style hooks', () => {
    render(<Presentation steps={steps} title="Example" />)
    expect(screen.getByRole('link', { name: 'made by and-scene' }).getAttribute('href')).toBe('https://github.com/and-scene/and-scene')
    expect(document.querySelector('[data-presentation-brand]')?.textContent).toBe('')
    expect(screen.getByRole('button', { name: 'Go to step 1: First' }).getAttribute('aria-current')).toBe('step')
    expect(document.querySelector('[data-presentation-progress-item][data-presentation-active="true"]')).toBeTruthy()
    expect(document.querySelector('[data-presentation-node="box"]')?.getAttribute('class')).toBe('local-style')
    expect(document.querySelector('[data-presentation-canvas]')?.getAttribute('style')).toContain('width: 880px')
    expect((document.querySelector('[data-presentation-stage]') as HTMLElement).style.gridTemplateColumns).toBe('minmax(0, 1fr)')
  })

  it('jumps by progress and table of contents, exposes active semantics, and clamps at ends', () => {
    render(<Presentation steps={steps} title="Example" />)
    fireEvent.click(screen.getByRole('button', { name: 'Previous step' }))
    expect(screen.getByText('First caption')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Finish' }))
    expect(screen.getByText('Third caption')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Go to step 3: Third' }).getAttribute('aria-current')).toBe('step')
    fireEvent.click(screen.getByRole('button', { name: 'Next step' }))
    expect(screen.getByText('Third caption')).toBeTruthy()
  })

  it('supports keyboard navigation, preserves focused control keys, and switches modes in place', () => {
    render(<Presentation steps={steps} title="Example" />)
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(screen.getByText('Second caption')).toBeTruthy()
    fireEvent.keyDown(screen.getByRole('button', { name: 'Next step' }), { key: 'ArrowRight' })
    expect(screen.getByText('Second caption')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Switch to present mode' }))
    expect(screen.getByText('Second')).toBeTruthy()
    expect(screen.queryByText('Second caption')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Next step' })).toBeNull()
    fireEvent.keyDown(window, { key: 'p' })
    expect(screen.getByText('Second caption')).toBeTruthy()
    expect(document.querySelector('[data-step-index="1"]')).toBeTruthy()
  })

  it('uses custom unstyled primitives without injecting visual defaults', () => {
    render(<Presentation steps={steps} title="Example" />)
    const node = document.querySelector('[data-presentation-node="box"]') as HTMLElement
    expect(node.style.color).toBe('')
    expect(node.style.backgroundColor).toBe('')
    expect(node.style.border).toBe('')
    expect(node.style.boxShadow).toBe('')
  })

  it('renders an empty-state message for empty step arrays', () => {
    render(<Presentation steps={[]} title="Empty" />)
    expect(screen.getByRole('status').textContent).toBe('This presentation has no steps.')
    expect(document.querySelector('[data-presentation-empty]')).toBeTruthy()
  })

  it('preserves malformed paths as a safe landing route', () => {
    expect(() => normalizeRoute('/%E0%A4%A')).not.toThrow()
    expect(normalizeRoute('/%E0%A4%A')).toBe('%E0%A4%A')
  })

  it('does not intercept modified or already-prevented keyboard shortcuts', () => {
    render(<Presentation steps={steps} title="Example" />)
    fireEvent.keyDown(window, { key: 'ArrowRight', altKey: true })
    fireEvent.keyDown(window, { key: 'p', ctrlKey: true })
    expect(screen.getByText('First caption')).toBeTruthy()
    const event = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true })
    event.preventDefault()
    window.dispatchEvent(event)
    expect(document.querySelector('[data-step-index="0"]')).toBeTruthy()
  })

  it('keeps stable entity hooks when conflicting data props are supplied', () => {
    render(<Box id="fixed-id" data-presentation-node="override" data-entity-id="override">Node</Box>)
    const node = document.querySelector('[data-presentation-node="box"]')
    expect(node?.getAttribute('data-entity-id')).toBe('fixed-id')
  })
})
