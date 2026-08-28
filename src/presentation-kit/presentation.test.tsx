import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { afterEach, describe, expect, test } from 'vitest'
import { Presentation } from './Presentation'
import type { SceneProps, Step } from './types'

type DemoPayload = { label: string }

function DemoScene({ payload }: SceneProps<DemoPayload>) {
  const [instance] = useState(() => crypto.randomUUID())

  return <output data-presentation-demo-scene="true" data-instance={instance}>{payload.label}</output>
}

const steps: readonly Step<DemoPayload>[] = [
  { id: 'start', era: 'setup', title: 'Start', caption: 'The beginning.', Scene: DemoScene, payload: { label: 'one' }, groupKey: 'demo' },
  { id: 'middle', era: 'setup', title: 'Middle', caption: 'The middle.', Scene: DemoScene, payload: { label: 'two' }, groupKey: 'demo' },
  { id: 'end', era: 'finish', title: 'End', caption: 'The ending.', Scene: DemoScene, payload: { label: 'three' } },
]

afterEach(cleanup)

describe('Presentation', () => {
  test('passes a grouped scene payload through the typed presentation boundary', () => {
    render(<Presentation<DemoPayload> title="Demo" steps={steps} />)

    expect(screen.getByTestId('presentation').getAttribute('data-step-count')).toBe('3')
    expect(screen.getByText('one')).toBeTruthy()
  })

  test('keeps a grouped scene instance while its payload advances', () => {
    render(<Presentation title="Demo" steps={steps} />)
    const firstInstance = screen.getByText('one').getAttribute('data-instance')

    fireEvent.keyDown(window, { key: 'ArrowRight' })

    expect(screen.getByText('two').getAttribute('data-instance')).toBe(firstInstance)
  })

  test('clamps keyboard navigation at the first and last step', () => {
    render(<Presentation title="Demo" steps={steps} />)

    fireEvent.keyDown(window, { key: 'ArrowLeft' })
    expect(screen.getByTestId('presentation').getAttribute('data-step-index')).toBe('0')

    fireEvent.keyDown(window, { key: 'End' })
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(screen.getByTestId('presentation').getAttribute('data-step-index')).toBe('2')
  })

  test('safely clamps a mounted presentation when its steps shrink', () => {
    const { rerender } = render(<Presentation title="Demo" steps={steps} />)
    fireEvent.click(screen.getByRole('button', { name: 'Go to step 3: End' }))

    expect(() => rerender(<Presentation title="Demo" steps={steps.slice(0, 1)} />)).not.toThrow()
    expect(screen.getByTestId('presentation').getAttribute('data-step-index')).toBe('0')
    expect(screen.getByText('one')).toBeTruthy()
  })

  test('does not hijack navigation keys from a focused control', () => {
    render(<Presentation title="Demo" steps={steps} />)
    const progress = screen.getByRole('button', { name: 'Go to step 2: Middle' })
    progress.focus()

    fireEvent.keyDown(progress, { key: 'ArrowRight' })

    expect(screen.getByTestId('presentation').getAttribute('data-step-index')).toBe('0')
  })

  test('does not hijack keys from every enabled contenteditable variant', () => {
    render(<Presentation title="Demo" steps={steps} />)
    const editable = document.createElement('div')
    editable.setAttribute('contenteditable', 'plaintext-only')
    document.body.append(editable)
    editable.focus()

    fireEvent.keyDown(editable, { key: 'ArrowRight' })

    expect(screen.getByTestId('presentation').getAttribute('data-step-index')).toBe('0')
    editable.remove()
  })

  test('does not treat diagonal vertical scrolling as a horizontal swipe', () => {
    render(<Presentation title="Demo" steps={steps} />)
    const presentation = screen.getByTestId('presentation')

    fireEvent.touchStart(presentation, { changedTouches: [{ clientX: 240, clientY: 80 }] })
    fireEvent.touchEnd(presentation, { changedTouches: [{ clientX: 100, clientY: 400 }] })

    expect(presentation.getAttribute('data-step-index')).toBe('0')
  })

  test('exposes semantic active progress and table-of-contents controls for direct jumps', () => {
    render(<Presentation title="Demo" steps={steps} />)
    const current = screen.getByRole('button', { name: 'Go to step 1: Start' })

    expect(current.getAttribute('aria-current')).toBe('step')
    expect(current.getAttribute('data-presentation-progress-active')).toBe('true')

    fireEvent.click(screen.getByRole('button', { name: 'Go to era: finish' }))
    expect(screen.getByTestId('presentation').getAttribute('data-step-index')).toBe('2')
    expect(screen.getByRole('button', { name: 'Go to era: finish' }).getAttribute('aria-current')).toBe('step')
  })

  test('switches modes without changing the active step', () => {
    render(<Presentation title="Demo" steps={steps} initialMode="browse" />)
    fireEvent.click(screen.getByRole('button', { name: 'Go to step 2: Middle' }))
    fireEvent.click(screen.getByRole('button', { name: 'Switch to present mode' }))

    expect(screen.getByTestId('presentation').getAttribute('data-presentation-mode')).toBe('present')
    expect(screen.getByTestId('presentation').getAttribute('data-step-index')).toBe('1')
    expect(screen.queryByText('The middle.')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Previous step' })).toBeNull()
  })

  test('uses viewport-constrained stage geometry for present mode', () => {
    render(<Presentation title="Demo" steps={steps} initialMode="present" />)
    const stage = document.querySelector('[data-presentation-stage]')

    expect(stage?.getAttribute('data-presentation-stage-mode')).toBe('present')
    expect(stage?.getAttribute('style')).toContain('height: calc(100dvh - 100px)')
    expect(stage?.getAttribute('style')).toContain('min-height: 0')
  })

  test('renders an unbranded default attribution with a stable style hook', () => {
    render(<Presentation title="Demo" steps={steps} />)
    const attribution = screen.getByRole('link', { name: 'made by and-scene' })

    expect(attribution.getAttribute('href')).toBe('https://github.com/Codagent-AI/and-scene')
    expect(attribution.getAttribute('data-presentation-attribution')).toBe('true')
    expect(screen.queryByRole('link', { name: 'and-scene' })).toBeNull()
  })
})
