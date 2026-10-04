// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { Presentation } from '../src/presentation-kit/Presentation'
import { Box } from '../src/presentation-kit/nodes'
import type { Step } from '../src/presentation-kit/types'

afterEach(() => { cleanup(); vi.restoreAllMocks() })
const Scene = ({ payload }: { payload: { text: string } }) => <Box id="shared" style={{ position: 'absolute', left: 20 }}>{payload.text}</Box>
const steps: Step<{ text: string }>[] = [
  { id: 'one', era: 'Start', title: 'One', caption: 'First', Scene, payload: { text: 'A' }, groupKey: 'g' },
  { id: 'two', era: 'Start', title: 'Two', caption: 'Second', Scene, payload: { text: 'B' }, groupKey: 'g' },
]

describe('presentation kit contract', () => {
  it('accepts typed grouped steps, keeps the scene mounted, and exposes style hooks without visual defaults', () => {
    const { container } = render(<Presentation steps={steps} title="Example" />)
    const scene = container.querySelector('[data-presentation-scene]')
    expect(scene).toBeTruthy()
    expect(container.querySelector('[data-presentation-node="box"]')?.getAttribute('style')).toContain('left: 20px')
    expect(container.querySelector('[data-presentation-node="box"]')?.getAttribute('style')).not.toMatch(/color|background|border|font/)
    fireEvent.keyDown(document.body, { key: 'ArrowRight' })
    expect(container.querySelector('[data-presentation-scene]')).toBe(scene)
    expect(screen.getByText('B')).toBeTruthy()
  })

  it('renders default attribution and semantic active state for progress and section navigation', () => {
    const { container } = render(<Presentation steps={steps} title="Example" />)
    const attribution = screen.getByText('made by and-scene').closest('a')
    expect(attribution?.getAttribute('href')).toBe('https://github.com/and-scene/and-scene')
    expect(attribution?.hasAttribute('data-presentation-attribution')).toBe(true)
    expect(container.querySelector('[data-presentation-progress-item][aria-current="step"]')).toBeTruthy()
    expect(container.querySelector('[data-presentation-toc-item][aria-current="location"]')).toBeTruthy()
    expect(container.querySelector('[data-presentation-brand]')).toBeNull()
  })

  it('clamps navigation, switches modes in place, and lets focused buttons own keys', () => {
    const { container } = render(<Presentation steps={steps} title="Example" />)
    fireEvent.keyDown(document.body, { key: 'ArrowLeft' })
    expect(container.querySelector('[data-step-index]')?.getAttribute('data-step-index')).toBe('0')
    fireEvent.keyDown(document.body, { key: 'ArrowRight' })
    expect(container.querySelector('[data-step-index]')?.getAttribute('data-step-index')).toBe('1')
    fireEvent.keyDown(document.body, { key: 'ArrowRight' })
    expect(container.querySelector('[data-step-index]')?.getAttribute('data-step-index')).toBe('1')
    fireEvent.click(screen.getByRole('button', { name: 'Switch to present mode' }))
    expect(container.querySelector('[data-step-index]')?.getAttribute('data-step-index')).toBe('1')
    expect(container.querySelector('[data-presentation-caption]')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Switch to browse mode' }))
    const next = screen.getByRole('button', { name: 'Next step' })
    next.focus(); fireEvent.keyDown(next, { key: 'ArrowLeft' })
    expect(container.querySelector('[data-step-index]')?.getAttribute('data-step-index')).toBe('1')
  })
})
