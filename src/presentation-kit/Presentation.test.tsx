// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { useEffect } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { Arrow, Box, Presentation, type SceneProps, type Step } from './index'

interface Payload { message: string }
let mountCount = 0
function Scene({ payload }: SceneProps<Payload>) {
  useEffect(() => { mountCount++ }, [])
  return <div><Box id="same-entity">{payload.message}</Box><Arrow id="connection" /></div>
}
const steps: Step<Payload>[] = [
  { id: 'one', era: 'start', title: 'First', caption: 'First caption', Scene, payload: { message: 'one' }, groupKey: 'story' },
  { id: 'two', era: 'middle', title: 'Second', caption: 'Second caption', Scene, payload: { message: 'two' }, groupKey: 'story' },
]
afterEach(cleanup)

describe('presentation kit contracts', () => {
  it('passes typed grouped payloads through the Presentation boundary and retains the scene instance', () => {
    mountCount = 0
    render(<Presentation<Payload> steps={steps} title="Typed" />)
    expect(screen.getByText('one')).toBeTruthy()
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(screen.getByText('two')).toBeTruthy()
    expect(mountCount).toBe(1)
  })

  it('exposes style hooks without applying visual defaults to primitives', () => {
    const { container } = render(<><Box id="box">Box</Box><Arrow id="arrow" /></>)
    const box = container.querySelector('[data-presentation-node="box"]') as HTMLElement
    expect(box.className).toContain('scene-box')
    expect(box.style.color).toBe('')
    expect(box.style.background).toBe('')
    expect(box.style.border).toBe('')
    expect(container.querySelector('[data-presentation-node="arrow"]')).toBeTruthy()
  })

  it('shows the default attribution with a stable hook and GitHub destination', () => {
    const { container } = render(<Presentation steps={steps} title="Attribution" />)
    const link = container.querySelector('[data-presentation-attribution] a') as HTMLAnchorElement
    expect(link.textContent).toBe('made by and-scene')
    expect(link.href).toBe('https://github.com/and-scene/and-scene')
    expect(container.querySelector('[data-presentation-brand]')?.textContent).toBe('')
  })

  it('exposes active progress and section semantics and clamps keyboard navigation at both ends', () => {
    render(<Presentation steps={steps} title="Navigation" />)
    expect(screen.getByRole('button', { name: 'Go to step 1: First' }).getAttribute('aria-current')).toBe('step')
    expect(screen.getByRole('button', { name: 'start' }).getAttribute('aria-current')).toBe('location')
    fireEvent.keyDown(window, { key: 'ArrowLeft' })
    expect(document.querySelector('[data-step-index]')?.getAttribute('data-step-index')).toBe('0')
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(document.querySelector('[data-step-index]')?.getAttribute('data-step-index')).toBe('1')
  })

  it('switches modes in place and keeps focused control keys with the control', () => {
    render(<Presentation steps={steps} title="Modes" />)
    const next = screen.getByRole('button', { name: 'Next step' })
    next.focus()
    fireEvent.keyDown(next, { key: 'ArrowRight' })
    expect(document.querySelector('[data-step-index]')?.getAttribute('data-step-index')).toBe('0')
    fireEvent.click(screen.getByRole('button', { name: 'Switch to present mode' }))
    expect(document.querySelector('[data-presentation-mode]')?.getAttribute('data-presentation-mode')).toBe('present')
    expect(document.querySelector('[data-step-index]')?.getAttribute('data-step-index')).toBe('0')
    expect(containerHas('data-presentation-progress')).toBe(false)
  })

  it('leaves browser and operating-system modifier shortcuts untouched', () => {
    render(<Presentation steps={steps} title="Shortcuts" />)
    fireEvent.keyDown(window, { key: 'ArrowLeft', altKey: true })
    fireEvent.keyDown(window, { key: 'ArrowRight', metaKey: true })
    fireEvent.keyDown(window, { key: 'p', ctrlKey: true })
    expect(document.querySelector('[data-step-index]')?.getAttribute('data-step-index')).toBe('0')
    expect(document.querySelector('[data-presentation-mode]')?.getAttribute('data-presentation-mode')).toBe('browse')
  })
})

function containerHas(selector: string) { return document.querySelector(`[${selector}]`) !== null }
