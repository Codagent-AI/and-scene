// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach } from 'vitest'
import { describe, expect, it } from 'vitest'
import { Presentation } from './Presentation'
import type { SceneProps, Step } from './types'

afterEach(cleanup)

interface Payload { message: string }
function Scene({ payload }: SceneProps<Payload>) { return <div data-scene-instance="">{payload.message}</div> }
const steps: Step<Payload>[] = [
  { id: 'one', era: 'Start', title: 'First', caption: 'First caption', payload: { message: 'one' }, Scene, groupKey: 'same' },
  { id: 'two', era: 'End', title: 'Second', caption: 'Second caption', payload: { message: 'two' }, Scene, groupKey: 'same' },
]

describe('Presentation contract', () => {
  it('accepts typed grouped payloads and exposes derived step metadata and attribution', () => {
    render(<Presentation<Payload> steps={steps} title="Typed example" />)
    expect(screen.getByText('one')).toBeTruthy()
    expect(document.querySelector('[data-step-count="2"][data-step-index="0"]')).toBeTruthy()
    expect(screen.getByRole('link', { name: 'made by and-scene' }).getAttribute('href')).toBe('https://github.com/Codagent-AI/and-scene')
    expect(document.querySelector('[data-presentation-header] a')).toBeNull()
    expect(screen.getByRole('button', { name: 'Go to step 1' }).getAttribute('aria-current')).toBe('step')
    expect(document.querySelector('[data-presentation-progress-item][data-active="true"]')).toBeTruthy()
    expect(document.querySelector('[data-presentation-toc-item][data-active="true"]')).toBeTruthy()
  })

  it('clamps navigation at both ends, jumps directly, and toggles modes without losing position', () => {
    render(<Presentation steps={steps} title="Example" />)
    fireEvent.click(screen.getByRole('button', { name: 'Previous step' }))
    expect(document.querySelector('[data-presentation][data-step-index="0"]')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Go to step 2' }))
    expect(document.querySelector('[data-presentation][data-step-index="1"]')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Next step' }))
    expect(document.querySelector('[data-presentation][data-step-index="1"]')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Switch to present mode' }))
    expect(document.querySelector('[data-presentation][data-mode="present"][data-step-index="1"]')).toBeTruthy()
    expect(screen.queryByText('Second caption')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Next step' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Switch to browse mode' }))
    expect(screen.getByText('Second caption')).toBeTruthy()
  })

  it('retains the grouped scene instance while its typed payload changes', () => {
    render(<Presentation steps={steps} title="Example" />)
    const original = document.querySelector('[data-scene-instance]')
    fireEvent.click(screen.getByRole('button', { name: 'Go to step 2' }))
    expect(screen.getByText('two')).toBeTruthy()
    expect(document.querySelector('[data-scene-instance]')).toBe(original)
  })

  it('handles a shrinking or empty step list without indexing a missing step', () => {
    const view = render(<Presentation steps={steps} title="Example" />)
    fireEvent.click(screen.getByRole('button', { name: 'Go to step 2' }))
    view.rerender(<Presentation steps={[steps[0]]} title="Example" />)
    expect(document.querySelector('[data-presentation][data-step-index="0"]')).toBeTruthy()
    view.rerender(<Presentation steps={[]} title="Example" />)
    expect(document.querySelector('[data-presentation][data-step-count="0"]')).toBeTruthy()
  })

  it('keeps keyboard navigation keys with focused controls', () => {
    render(<Presentation steps={steps} title="Example" />)
    const control = screen.getByRole('button', { name: 'Go to step 1' })
    control.focus()
    fireEvent.keyDown(control, { key: 'ArrowRight' })
    expect(document.querySelector('[data-presentation][data-step-index="0"]')).toBeTruthy()
    fireEvent.keyDown(window, { key: 'ArrowRight', repeat: true })
    expect(document.querySelector('[data-presentation][data-step-index="0"]')).toBeTruthy()
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(document.querySelector('[data-presentation][data-step-index="1"]')).toBeTruthy()
  })

  it('keeps presentation primitives free of visual declarations', () => {
    const styles = Object.values(import.meta.glob('./nodes/*.tsx', { eager: true, query: '?raw', import: 'default' }))
    expect(styles.join('\n')).not.toMatch(/(?:#[\da-f]{3,8}|\b(?:color|background|border|boxShadow|fontFamily|fontSize)\s*:)/i)
  })
})
