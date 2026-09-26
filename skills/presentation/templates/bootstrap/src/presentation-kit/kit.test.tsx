// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { useEffect } from 'react'
import { Presentation } from './Presentation'
import { Box } from './nodes'
import { useFitScale } from './useFitScale'
import type { Step } from './types'

type Payload = { readonly message: string }
function MessageScene({ payload }: { payload: Payload }) { return <div>{payload.message}</div> }
const steps: Step<Payload>[] = [
  { id: 'one', era: 'start', title: 'First', caption: 'First caption', scene: MessageScene, payload: { message: 'typed payload' }, groupKey: 'story' },
  { id: 'two', era: 'end', title: 'Second', caption: 'Second caption', scene: MessageScene, payload: { message: 'next payload' }, groupKey: 'story' },
]
let sceneMounts = 0
function PersistentScene({ payload }: { payload: Payload }) {
  useEffect(() => { sceneMounts += 1 }, [])
  return <div data-scene-message="">{payload.message}</div>
}
const groupedSteps: Step<Payload>[] = steps.map((step) => ({ ...step, scene: PersistentScene }))
function ScaleProbe({ width, height }: { width: number; height: number }) {
  return <output data-testid="scale">{useFitScale(width, height, 'browse')}</output>
}

describe('presentation kit contract', () => {
  afterEach(cleanup)
  it('passes grouped payloads through the generic presentation boundary and exposes navigation semantics', () => {
    render(<Presentation steps={steps} title="Typed" />)
    expect(screen.getByText('typed payload')).toBeTruthy()
    expect(screen.getByRole('link', { name: 'made by and-scene' }).getAttribute('href')).toContain('github.com')
    fireEvent.click(screen.getByRole('button', { name: /next/i }))
    expect(screen.getByText('next payload')).toBeTruthy()
    expect(screen.getByRole('button', { name: /second/i }).getAttribute('aria-current')).toBe('step')
    expect(screen.queryByRole('link', { name: /and-scene/i })?.closest('[data-presentation-header]')).toBeNull()
  })

  it('supports modes, direct navigation, and clamps at both ends', () => {
    render(<Presentation steps={steps} title="Navigation" initialMode="present" />)
    expect(screen.queryByText('First caption')).toBeNull()
    fireEvent.keyDown(window, { key: 'ArrowLeft' })
    expect(document.querySelector('[data-step-index="0"]')).toBeTruthy()
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(document.querySelector('[data-step-index="1"]')).toBeTruthy()
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(document.querySelector('[data-step-index="1"]')).toBeTruthy()
  })

  it('keeps a grouped scene mounted as its typed state changes', () => {
    sceneMounts = 0
    render(<Presentation steps={groupedSteps} title="Continuity" />)
    fireEvent.click(screen.getByRole('button', { name: /next/i }))
    expect(screen.getByText('next payload')).toBeTruthy()
    expect(sceneMounts).toBe(1)
  })

  it('keeps primitive visuals author-owned and exposes only identity hooks', () => {
    const { container } = render(<Box id="entity-a">Node</Box>)
    const node = container.querySelector('[data-presentation-box]') as HTMLElement
    expect(node.getAttribute('data-layoutid')).toBeNull()
    expect(node.style.color).toBe('')
    expect(node.style.backgroundColor).toBe('')
    expect(node.className).toBe('')
  })

  it('shows the active step title in present mode and keeps mode switches on the same step', () => {
    render(<Presentation steps={steps} title="Modes" />)
    fireEvent.click(screen.getByRole('button', { name: /next/i }))
    fireEvent.click(screen.getByRole('button', { name: /switch to present/i }))
    expect(screen.getByText('Second')).toBeTruthy()
    expect(screen.queryByText('Second caption')).toBeNull()
    expect(document.querySelector('[data-step-index="1"]')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /switch to browse/i }))
    expect(screen.getByText('Second caption')).toBeTruthy()
  })

  it('continues keyboard navigation while the mode toggle has focus', () => {
    render(<Presentation steps={steps} title="Focused navigation" />)
    const toggle = screen.getByRole('button', { name: /switch to present/i })
    fireEvent.click(toggle)
    const focusedToggle = screen.getByRole('button', { name: /switch to browse/i })
    focusedToggle.focus()
    fireEvent.keyDown(focusedToggle, { key: 'ArrowRight' })
    expect(document.querySelector('[data-step-index="1"]')).toBeTruthy()
  })

  it('keeps fit scale positive in viewports shorter than the chrome', () => {
    const originalHeight = window.innerHeight
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 100 })
    try {
      render(<ScaleProbe width={880} height={380} />)
      expect(Number(screen.getByTestId('scale').textContent)).toBeGreaterThan(0)
    } finally {
      Object.defineProperty(window, 'innerHeight', { configurable: true, value: originalHeight })
    }
  })

  it('rejects invalid design dimensions before calculating fit scale', () => {
    expect(() => render(<ScaleProbe width={0} height={380} />)).toThrow(RangeError)
    cleanup()
    expect(() => render(<ScaleProbe width={880} height={Number.POSITIVE_INFINITY} />)).toThrow(RangeError)
  })
})
