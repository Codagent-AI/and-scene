// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Presentation } from './Presentation.js'
import type { Step } from './types.js'

function Scene({ payload }: { payload: { label: string } }) { return <p>{payload.label}</p> }
const steps: Step<{ label: string }>[] = [
  { id: 'a', era: 'Start', title: 'First', caption: 'First caption', scene: Scene, payload: { label: 'one' }, groupKey: 'same' },
  { id: 'b', era: 'Next', title: 'Second', caption: 'Second caption', scene: Scene, payload: { label: 'two' }, groupKey: 'same' },
]

describe('Presentation', () => {
  it('accepts a typed payload array, exposes active semantics, and switches modes in place', () => {
    render(<Presentation steps={steps} title="Demo" />)
    expect(screen.getByText('one')).toBeTruthy()
    expect(document.querySelector('[data-step-index="0"]')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Go to step 2: Second' }))
    expect(screen.getByText('two')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Go to step 2: Second' }).getAttribute('aria-current')).toBe('step')
    fireEvent.click(screen.getByRole('button', { name: 'Switch to present mode' }))
    expect(document.querySelector('[data-presentation-mode="present"][data-step-index="1"]')).toBeTruthy()
    expect(screen.queryByText('Second caption')).toBeNull()
  })

  it('clamps navigation at both ends and leaves focused control keys to the control', () => {
    render(<Presentation steps={steps} title="Demo" />)
    fireEvent.keyDown(window, { key: 'ArrowLeft' })
    expect(document.querySelector('[data-step-index="0"]')).toBeTruthy()
    const next = document.querySelector<HTMLButtonElement>('.presentation-next')!
    next.focus()
    fireEvent.keyDown(next, { key: 'ArrowRight' })
    expect(document.querySelector('[data-step-index="0"]')).toBeTruthy()
    fireEvent.click(next)
    fireEvent.click(next)
    expect(document.querySelector('[data-step-index="1"]')).toBeTruthy()
  })
})
