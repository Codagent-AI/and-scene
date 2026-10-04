import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { useEffect } from 'react'
import { Presentation } from '../Presentation'
import { Box } from '../nodes/Box'
import type { SceneProps, Step } from '../types'
import { calculateFitScale } from '../useFitScale'

afterEach(() => { cleanup(); vi.restoreAllMocks() })

type Payload = { message: string }
const mounts = vi.fn()
function GroupScene({ payload }: SceneProps<Payload>) {
  useEffect(() => { mounts(); return () => mounts() }, [])
  return <Box id="stable-entity">{payload.message}</Box>
}
function OtherScene({ payload }: SceneProps<Payload>) { return <Box id="stable-entity">{payload.message}</Box> }
const steps: Step<Payload>[] = [
  { id: 'one', era: 'Start', title: 'First', caption: 'First caption', groupKey: 'story', Scene: GroupScene, payload: { message: 'one' } },
  { id: 'two', era: 'Middle', title: 'Second', caption: 'Second caption', groupKey: 'story', Scene: GroupScene, payload: { message: 'two' } },
  { id: 'three', era: 'End', title: 'Third', caption: 'Third caption', groupKey: 'story', Scene: OtherScene, payload: { message: 'three' } },
]

describe('presentation kit contract', () => {
  it('accepts typed grouped payload steps at the Presentation boundary', () => {
    render(<Presentation<Payload> steps={steps} title="Typed" />)
    expect(screen.getByText('one')).toBeTruthy()
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(screen.getByText('two')).toBeTruthy()
    expect(mounts).toHaveBeenCalledTimes(1)
  })

  it('keeps presentation styling out of generic primitives and exposes stable hooks', () => {
    render(<Box id="topic-id" className="author-node">Topic</Box>)
    const node = document.querySelector('[data-presentation-box]') as HTMLElement
    expect(node.dataset.presentationNode).toBe('')
    expect(node.className).toBe('author-node')
    expect(node.style.color).toBe('')
    expect(node.style.fontFamily).toBe('')
    expect(node.style.border).toBe('')
  })

  it('renders attribution with a styling hook and no built-in top-left brand', () => {
    render(<Presentation steps={steps} title="Attribution" />)
    const link = screen.getByRole('link', { name: 'made by and-scene' })
    expect(link.getAttribute('href')).toBe('https://github.com/Codagent-AI/and-scene')
    expect(link.hasAttribute('data-presentation-attribution')).toBe(true)
    expect(document.querySelector('[data-presentation-brand]')).toBeNull()
  })

  it('exposes active navigation semantics, allows direct jumps, and clamps at both ends', () => {
    render(<Presentation steps={steps} title="Navigation" />)
    expect(screen.getByRole('button', { name: '1: First' }).getAttribute('aria-current')).toBe('step')
    fireEvent.click(screen.getByRole('button', { name: '3: Third' }))
    expect(document.querySelector('[data-step-index]')?.getAttribute('data-step-index')).toBe('2')
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(document.querySelector('[data-step-index]')?.getAttribute('data-step-index')).toBe('2')
    fireEvent.keyDown(window, { key: 'ArrowLeft' })
    expect(document.querySelector('[data-step-index]')?.getAttribute('data-step-index')).toBe('1')
    expect(screen.getByRole('button', { name: 'Middle' }).getAttribute('aria-current')).toBe('location')
  })

  it('supports modes without losing position and leaves navigation keys to focused controls', () => {
    render(<Presentation steps={steps} title="Modes" />)
    const modeButton = screen.getByRole('button', { name: 'Switch to present mode' })
    fireEvent.keyDown(modeButton, { key: ' ' })
    expect(document.querySelector('[data-mode]')?.getAttribute('data-mode')).toBe('browse')
    expect(document.querySelector('[data-step-index]')?.getAttribute('data-step-index')).toBe('0')
    fireEvent.click(modeButton)
    expect(document.querySelector('[data-mode]')?.getAttribute('data-mode')).toBe('present')
    expect(document.querySelector('[data-step-index]')?.getAttribute('data-step-index')).toBe('0')
    expect(screen.queryByText('First caption')).toBeNull()
    fireEvent.keyDown(screen.getByRole('button', { name: 'Switch to browse mode' }), { key: 'ArrowRight' })
    expect(document.querySelector('[data-step-index]')?.getAttribute('data-step-index')).toBe('1')
    fireEvent.keyDown(window, { key: 'p', ctrlKey: true })
    expect(document.querySelector('[data-mode]')?.getAttribute('data-mode')).toBe('present')
    fireEvent.click(screen.getByRole('button', { name: 'Switch to browse mode' }))
    expect(document.querySelector('[data-mode]')?.getAttribute('data-mode')).toBe('browse')
    expect(document.querySelector('[data-step-index]')?.getAttribute('data-step-index')).toBe('1')
  })

  it('fits a default 880 by 380 canvas uniformly and follows mode geometry', () => {
    expect(calculateFitScale(1760, 1000, 'present')).toBe(1)
    expect(calculateFitScale(440, 500, 'present')).toBe(0.5)
    expect(calculateFitScale(1760, 500, 'browse')).toBeLessThan(calculateFitScale(1760, 500, 'present'))
  })
})
