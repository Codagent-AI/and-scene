// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { useEffect } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { Presentation } from './Presentation'
import { Box } from './nodes/Box'
import { DESIGN_H, DESIGN_W } from './constants'
import { getFitScale } from './useFitScale'
import type { SceneProps, Step } from './types'

type Payload = { value: number }

const stepIndex = () => document.querySelector('[data-presentation][data-step-index]')?.getAttribute('data-step-index')

function Scene({ payload }: SceneProps<Payload>) {
  return <div data-testid="scene-value">{payload.value}</div>
}

const steps: Step<Payload>[] = [
  { id: 'one', section: 'Start', title: 'First', caption: 'First caption', Scene, payload: { value: 1 }, groupKey: 'same' },
  { id: 'two', section: 'Start', title: 'Second', caption: 'Second caption', Scene, payload: { value: 2 }, groupKey: 'same' },
  { id: 'three', section: 'End', title: 'Third', caption: 'Third caption', Scene: ({ payload }) => <div>{payload.value}</div>, payload: { value: 3 } },
]

describe('Presentation', () => {
  afterEach(cleanup)
  it('accepts strongly typed grouped steps and retains the scene instance across their transition', () => {
    let mounts = 0
    function StatefulScene({ payload }: SceneProps<Payload>) {
      useEffect(() => { mounts += 1; return () => { mounts -= 1 } }, [])
      return <div data-testid="scene-value">{payload.value}</div>
    }
    const grouped: Step<Payload>[] = steps.slice(0, 2).map((step) => ({ ...step, Scene: StatefulScene }))
    render(<Presentation steps={grouped} title="Typed" initialMode="browse" />)
    expect(document.querySelector('[data-presentation-canvas-frame]')?.getAttribute('style')).toContain('position: relative')
    expect(document.querySelector('[data-presentation-scene]')?.getAttribute('style')).toContain('position: absolute')
    fireEvent.click(screen.getByRole('button', { name: /next/i }))
    expect(screen.getByTestId('scene-value').textContent).toBe('2')
    expect(mounts).toBe(1)
  }, 15000)

  it('clamps navigation, exposes active semantics, and toggles mode without changing position', () => {
    render(<Presentation steps={steps} title="Example" initialMode="browse" />)
    expect(document.querySelector('[data-presentation][data-step-count]')?.getAttribute('data-step-count')).toBe('3')
    expect(stepIndex()).toBe('0')
    expect(screen.getByRole('link', { name: 'made by and-scene' }).getAttribute('href')).toBe('https://github.com/and-scene')
    expect(document.querySelector('[data-presentation-brand]')).toBeNull()
    expect(screen.getByRole('button', { name: 'Step 1' }).getAttribute('aria-current')).toBe('step')
    expect(screen.getByRole('button', { name: 'Step 1' }).getAttribute('data-presentation-active')).toBe('true')
    fireEvent.click(screen.getByRole('button', { name: /next/i }))
    fireEvent.click(screen.getByRole('button', { name: /present mode/i }))
    expect(stepIndex()).toBe('1')
    expect(screen.getByText('Second')).not.toBeNull()
    expect(screen.queryByText('Second caption')).toBeNull()
    fireEvent.keyDown(window, { key: 'ArrowLeft' })
    expect(stepIndex()).toBe('0')
  })

  it('supports direct navigation and does not capture navigation keys from controls', () => {
    render(<Presentation steps={steps} title="Example" initialMode="browse" />)
    const input = document.createElement('input')
    document.body.append(input)
    input.focus()
    fireEvent.keyDown(input, { key: 'ArrowRight' })
    expect(stepIndex()).toBe('0')
    fireEvent.click(screen.getByRole('button', { name: 'Step 3' }))
    expect(stepIndex()).toBe('2')
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(stepIndex()).toBe('2')
    input.remove()
  })

  it('clamps keyboard and touch navigation at both ends and exposes section jump state', () => {
    render(<Presentation steps={steps} title="Example" initialMode="browse" />)
    fireEvent.keyDown(window, { key: 'ArrowLeft' })
    expect(stepIndex()).toBe('0')
    const tocEnd = screen.getByRole('button', { name: 'End' })
    expect(tocEnd.getAttribute('aria-current')).toBeNull()
    fireEvent.click(tocEnd)
    expect(stepIndex()).toBe('2')
    expect(tocEnd.getAttribute('aria-current')).toBe('location')
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(stepIndex()).toBe('2')
    fireEvent.click(screen.getByRole('button', { name: 'Step 2' }))
    const stage = document.querySelector('[data-presentation-stage]')!
    fireEvent.touchStart(stage, { changedTouches: [{ identifier: 1, clientX: 80, clientY: 40 }] })
    fireEvent.touchEnd(stage, { changedTouches: [{ identifier: 1, clientX: 180, clientY: 42 }] })
    expect(stepIndex()).toBe('0')
    fireEvent.touchStart(stage, { changedTouches: [{ identifier: 1, clientX: 180, clientY: 40 }] })
    fireEvent.touchEnd(stage, { changedTouches: [{ identifier: 1, clientX: 80, clientY: 42 }] })
    expect(stepIndex()).toBe('1')
  })

  it('centers the scaled canvas using its scaled frame size at narrow viewports', () => {
    const originalWidth = window.innerWidth
    try {
      window.innerWidth = 390
      render(<Presentation steps={steps} title="Example" initialMode="browse" />)
      fireEvent(window, new Event('resize'))
      const frame = document.querySelector('[data-presentation-canvas-frame]')
      expect(frame?.getAttribute('style')).toContain('width: 350px')
      expect(document.querySelector('[data-presentation-canvas]')?.getAttribute('style')).toContain('transform-origin: top left')
    } finally {
      window.innerWidth = originalWidth
      fireEvent(window, new Event('resize'))
    }
  })

  it('uses a uniform fixed-canvas fit scale for each mode', () => {
    expect(DESIGN_W).toBe(880)
    expect(DESIGN_H).toBe(380)
    expect(getFitScale(1000, 900, 'browse')).toBe(Math.min(1, (1000 - 40) / DESIGN_W, (900 - 208) / DESIGN_H))
    expect(getFitScale(320, 480, 'browse')).toBe(Math.min(1, (320 - 40) / DESIGN_W, (480 - 208) / DESIGN_H))
    expect(getFitScale(320, 480, 'present')).toBe(Math.min(1, (320 - 48) / DESIGN_W, (480 - 120) / DESIGN_H))
    expect(getFitScale(2000, 1200, 'browse')).toBe(1)
  })

  it('exposes author styling hooks without supplying visual defaults', () => {
    render(<Box id="entity-a" className="custom-card" data-state="active" style={{ position: 'absolute' }}>Entity</Box>)
    const box = screen.getByText('Entity')
    expect(box.classList.contains('custom-card')).toBe(true)
    expect(box.getAttribute('data-entity-id')).toBe('entity-a')
    expect(box.getAttribute('data-state')).toBe('active')
    expect(box.style.backgroundColor).toBe('')
    expect(box.style.border).toBe('')
    expect(box.style.fontFamily).toBe('')
    expect(box.style.position).toBe('absolute')
  })

  it('shows the table of contents on wide viewports and hides it when narrow', () => {
    render(<Presentation steps={steps} title="Example" initialMode="browse" />)
    expect(screen.getByRole('navigation', { name: 'Table of contents' })).not.toBeNull()
    window.innerWidth = 375
    fireEvent(window, new Event('resize'))
    expect(screen.queryByRole('navigation', { name: 'Table of contents' })).toBeNull()
    window.innerWidth = 1024
    fireEvent(window, new Event('resize'))
  })

  it('clamps the active step when the steps array shrinks', () => {
    const view = render(<Presentation steps={steps} title="Example" initialMode="browse" />)
    fireEvent.click(screen.getByRole('button', { name: 'Step 3' }))
    view.rerender(<Presentation steps={steps.slice(0, 2)} title="Example" initialMode="browse" />)
    expect(stepIndex()).toBe('1')
    expect(screen.getByTestId('scene-value').textContent).toBe('2')
  })
})
