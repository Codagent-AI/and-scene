import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { useEffect } from 'react'
import { Presentation } from './Presentation'
import { Box } from './nodes/Box'
import type { Step } from './types'

afterEach(cleanup)

type Model = { message: string }
let sceneMounts = 0
function ModelScene({ payload }: { payload: Model }) {
  useEffect(() => { sceneMounts += 1 }, [])
  return <p>{payload.message}</p>
}

const steps: Step<Model>[] = [
  { id: 'one', era: 'Start', title: 'First', caption: 'First caption', groupKey: 'model', Scene: ModelScene, payload: { message: 'typed payload' } },
  { id: 'two', era: 'Start', title: 'Second', caption: 'Second caption', groupKey: 'model', Scene: ModelScene, payload: { message: 'updated payload' } },
]

describe('Presentation', () => {
  it('updates grouped scene payload in place without remounting the scene', async () => {
    sceneMounts = 0
    render(<Presentation steps={steps} title="Test deck" />)
    expect(sceneMounts).toBe(1)
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    await waitFor(() => expect(screen.getByText('updated payload')).toBeTruthy())
    expect(sceneMounts).toBe(1)
  })

  it('accepts typed grouped steps, renders default attribution, and exposes active step state', () => {
    render(<Presentation steps={steps} title="Test deck" />)
    expect(screen.getByText('typed payload')).toBeTruthy()
    expect(screen.getByRole('link', { name: 'made by and-scene' }).getAttribute('href')).toContain('github.com')
    expect(screen.getByRole('button', { name: /first/i }).getAttribute('aria-current')).toBe('step')
    expect(screen.getByRole('button', { name: /first/i }).hasAttribute('data-presentation-active')).toBe(true)
  })

  it('offers primitive styling hooks without visual defaults', () => {
    const { container } = render(<Box id="entity-1" className="author-box">Entity</Box>)
    const box = container.querySelector('[data-presentation-box]') as HTMLElement
    expect(box.className).toContain('author-box')
    expect(box.style.color).toBe('')
    expect(box.style.backgroundColor).toBe('')
    expect(box.style.border).toBe('')
    expect(box.style.boxShadow).toBe('')
  })

  it('clamps navigation and preserves the active step when toggling modes', async () => {
    render(<Presentation steps={steps} title="Test deck" />)
    fireEvent.keyDown(window, { key: 'ArrowLeft' })
    expect(document.querySelector('[data-step-index="0"]')).toBeTruthy()
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    await waitFor(() => expect(document.querySelector('[data-step-index="1"]')).toBeTruthy())
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(document.querySelector('[data-step-index="1"]')).toBeTruthy()
    fireEvent.keyDown(window, { key: 'p' })
    expect(document.querySelector('[data-step-index="1"]')).toBeTruthy()
    expect(document.querySelector('[data-presentation-mode="present"]')).toBeTruthy()
    expect(screen.queryByText('Second caption')).toBeNull()
    expect(screen.queryByRole('navigation', { name: 'Step navigation' })).toBeNull()
    expect(screen.queryByRole('navigation', { name: 'Table of contents' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Switch to browse mode' }))
    expect(screen.getByText('Second caption')).toBeTruthy()
  })

  it('does not capture navigation keys from focused controls', () => {
    render(<Presentation steps={steps} title="Test deck" />)
    const button = screen.getByRole('button', { name: '2: Second' })
    button.focus()
    fireEvent.keyDown(button, { key: 'ArrowRight' })
    expect(screen.getByText('typed payload')).toBeTruthy()
  })

  it('clamps the active step when the steps array shrinks', async () => {
    const { rerender } = render(<Presentation steps={steps} title="Test deck" />)
    fireEvent.click(screen.getByRole('button', { name: '2: Second' }))
    expect(document.querySelector('[data-step-index="1"]')).toBeTruthy()
    rerender(<Presentation steps={steps.slice(0, 1)} title="Test deck" />)
    await waitFor(() => expect(document.querySelector('[data-step-index="0"]')).toBeTruthy())
    expect(screen.getByText('typed payload')).toBeTruthy()
  })

  it('leaves modified shortcuts to the browser', () => {
    render(<Presentation steps={steps} title="Test deck" />)
    fireEvent.keyDown(window, { key: 'p', ctrlKey: true })
    fireEvent.keyDown(window, { key: 'ArrowRight', metaKey: true })
    fireEvent.keyDown(window, { key: 'PageDown', altKey: true })
    expect(document.querySelector('[data-step-index="0"]')).toBeTruthy()
    expect(document.querySelector('[data-presentation-mode="browse"]')).toBeTruthy()
  })
})
