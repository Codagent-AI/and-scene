// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { useEffect } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { Presentation } from './Presentation'
import type { SceneProps, Step } from './types'

interface State { message: string }
function Scene({ payload }: SceneProps<State>) { return <div>{payload.message}</div> }
const steps: Step<State>[] = [
  { id: 'one', era: 'Start', title: 'First', caption: 'First explanation', groupKey: 'same', payload: { message: 'one' }, Scene },
  { id: 'two', era: 'Start', title: 'Second', caption: 'Second explanation', groupKey: 'same', payload: { message: 'two' }, Scene },
]

describe('Presentation', () => {
  afterEach(cleanup)
  it('accepts typed grouped steps, updates the existing scene, and exposes active semantics', () => {
    let mounts = 0
    function Tracked({ payload }: SceneProps<State>) { useEffect(() => { mounts += 1 }, []); return <div>{payload.message}</div> }
    const grouped = steps.map((step) => ({ ...step, Scene: Tracked }))
    render(<Presentation<State> steps={grouped} title="A title" />)
    expect(screen.getByText('one')).toBeTruthy()
    expect(screen.getByRole('button', { name: /go to step 1/i }).getAttribute('aria-current')).toBe('step')
    expect(screen.getByRole('link', { name: 'made by and-scene' }).getAttribute('href')).toBe('https://github.com/and-scene/and-scene')
    expect(document.querySelector('[data-presentation-brand]')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: /go to step 2/i }))
    expect(screen.getByText('two')).toBeTruthy()
    expect(mounts).toBe(1)
    expect(screen.getByRole('button', { name: /go to step 2/i }).getAttribute('aria-current')).toBe('step')
  })

  it('switches to present mode in place and back using the mode control', () => {
    render(<Presentation steps={steps} title="A title" />)
    fireEvent.click(screen.getByRole('button', { name: 'Switch to present mode' }))
    expect(document.querySelector('[data-presentation]')?.getAttribute('data-presentation-mode')).toBe('present')
    expect(screen.queryByText('First explanation')).toBeNull()
    expect(screen.queryByRole('navigation', { name: 'Table of contents' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Switch to browse mode' }))
    expect(document.querySelector('[data-presentation]')?.getAttribute('data-presentation-mode')).toBe('browse')
    expect(screen.getByText('First explanation')).toBeTruthy()
  })

  it('supports keyboard navigation, clamps at each end, and leaves focused controls in control', () => {
    render(<Presentation steps={steps} title="A title" />)
    fireEvent.keyDown(window, { key: 'ArrowLeft' })
    expect(document.querySelector('[data-step-index]')?.getAttribute('data-step-index')).toBe('0')
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(document.querySelector('[data-step-index]')?.getAttribute('data-step-index')).toBe('1')
    fireEvent.keyDown(window, { key: 'PageDown' })
    expect(document.querySelector('[data-step-index]')?.getAttribute('data-step-index')).toBe('1')
    const next = screen.getByRole('button', { name: 'Next step' })
    next.focus()
    fireEvent.keyDown(next, { key: 'ArrowLeft' })
    expect(document.querySelector('[data-step-index]')?.getAttribute('data-step-index')).toBe('0')
  })

  it('keeps arrow navigation available while a mode button retains focus, without hijacking its activation keys', () => {
    render(<Presentation steps={steps} title="A title" />)
    const presentButton = screen.getByRole('button', { name: 'Switch to present mode' })
    presentButton.focus()
    fireEvent.click(presentButton)

    fireEvent.keyDown(presentButton, { key: 'ArrowRight' })
    expect(document.querySelector('[data-step-index]')?.getAttribute('data-step-index')).toBe('1')

    for (const key of [' ', 'Enter']) {
      const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true })
      presentButton.dispatchEvent(event)
      expect(event.defaultPrevented).toBe(false)
    }
  })

  it('does not handle presentation shortcuts from editable controls', () => {
    render(<Presentation steps={steps} title="A title" />)
    const input = document.createElement('input')
    document.body.append(input)
    fireEvent.keyDown(input, { key: 'ArrowRight' })
    expect(document.querySelector('[data-step-index]')?.getAttribute('data-step-index')).toBe('0')
    input.remove()
  })

  it('clamps the active step immediately when the step list shrinks', () => {
    const view = render(<Presentation steps={steps} title="A title" />)
    fireEvent.click(screen.getByRole('button', { name: /go to step 2/i }))
    expect(document.querySelector('[data-step-index]')?.getAttribute('data-step-index')).toBe('1')
    view.rerender(<Presentation steps={steps.slice(0, 1)} title="A title" />)
    expect(screen.getByText('First explanation')).toBeTruthy()
    expect(document.querySelector('[data-step-index]')?.getAttribute('data-step-index')).toBe('0')
  })
})
