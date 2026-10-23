import '@testing-library/jest-dom/vitest'
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { useEffect } from 'react'
import { describe, expect, it } from 'vitest'
import { Box, Presentation, SceneLayer, defineStep } from '../../src/presentation-kit'
import type { PresentationStep, SceneProps } from '../../src/presentation-kit'

interface Payload {
  ids: string[]
}

let mounts = 0
function useMountCounter() {
  useEffect(() => {
    mounts++
  }, [])
}

function Scene({ payload }: SceneProps<Payload>) {
  // Counts real mounts of the scene instance.
  useMountCounter()
  return (
    <SceneLayer>
      {payload.ids.map((id, i) => (
        <Box key={id} id={id} x={10 + i * 120} y={10} width={100} height={40}>
          <span>{id}</span>
        </Box>
      ))}
    </SceneLayer>
  )
}

const meta = (n: number, era: string) => ({ id: `s${n}`, era, title: `Title ${n}`, caption: `Caption ${n}` })

const grouped = (n: number, era: string, ids: string[]): PresentationStep =>
  defineStep({ ...meta(n, era), groupKey: 'g', Scene, payload: { ids } })

const steps = [
  grouped(1, 'one', ['a']),
  grouped(2, 'one', ['a', 'b']),
  grouped(3, 'two', ['b']),
  defineStep({ ...meta(4, 'two'), Scene, payload: { ids: ['z'] } }),
]

const root = (c: HTMLElement) => c.querySelector('[data-presentation-root]') as HTMLElement
const press = (k: string) => act(() => void fireEvent.keyDown(window, { key: k }))

describe('Presentation chrome', () => {
  it('browse mode shows title, caption, controls, progress and the table of contents', () => {
    window.innerWidth = 1280
    const { container } = render(<Presentation steps={steps} title="Deck" initialMode="browse" />)
    expect(root(container)).toHaveAttribute('data-presentation-mode', 'browse')
    expect(screen.getByRole('heading', { name: 'Title 1' })).toBeInTheDocument()
    expect(container.querySelector('[data-presentation-caption]')).toHaveTextContent('Caption 1')
    expect(screen.getByLabelText('Previous step')).toBeInTheDocument()
    expect(screen.getByLabelText('Next step')).toBeInTheDocument()
    expect(container.querySelectorAll('[data-presentation-dot]')).toHaveLength(4)
    expect(container.querySelectorAll('[data-presentation-toc-entry]')).toHaveLength(2)
  })

  it('hides the table of contents on narrow viewports', () => {
    window.innerWidth = 500
    const { container } = render(<Presentation steps={steps} title="Deck" />)
    expect(container.querySelector('[data-presentation-toc]')).toBeNull()
    expect(container.querySelector('[data-presentation-dot]')).not.toBeNull()
  })

  it('present mode shows only the marker and one-line title', () => {
    window.innerWidth = 1280
    const { container } = render(<Presentation steps={steps} title="Deck" initialMode="present" />)
    expect(container.querySelector('[data-presentation-marker]')).toHaveTextContent('1 / 4')
    expect(container.querySelector('[data-presentation-title]')).toHaveTextContent('Title 1')
    for (const hidden of ['caption', 'toc', 'prev', 'next', 'progress']) {
      expect(container.querySelector(`[data-presentation-${hidden}]`)).toBeNull()
    }
  })

  it('toggles the mode with P and stays on the current step', () => {
    const { container } = render(<Presentation steps={steps} title="Deck" initialMode="browse" />)
    press('ArrowRight')
    press('ArrowRight')
    press('p')
    expect(root(container)).toHaveAttribute('data-presentation-mode', 'present')
    expect(root(container)).toHaveAttribute('data-step-index', '2')
    fireEvent.click(screen.getByRole('button', { name: 'Browse' }))
    expect(root(container)).toHaveAttribute('data-presentation-mode', 'browse')
    expect(root(container)).toHaveAttribute('data-step-index', '2')
  })

  it('exposes step count and index hooks that follow navigation', () => {
    const { container } = render(<Presentation steps={steps} title="Deck" />)
    expect(root(container)).toHaveAttribute('data-step-count', '4')
    press('ArrowRight')
    expect(root(container)).toHaveAttribute('data-step-index', '1')
    fireEvent.click(screen.getByLabelText('Previous step'))
    expect(root(container)).toHaveAttribute('data-step-index', '0')
  })

  it('derives step numbers from position when steps are reordered', () => {
    const { container, rerender } = render(<Presentation steps={steps} title="Deck" />)
    press('ArrowRight')
    expect(container.querySelector('[data-presentation-marker]')).toHaveTextContent('2 / 4')
    rerender(<Presentation steps={[steps[3], steps[0], steps[1], steps[2]]} title="Deck" />)
    expect(container.querySelector('[data-presentation-marker]')).toHaveTextContent('2 / 4')
    expect(container.querySelector('[data-presentation-title]')).toHaveTextContent('Title 1')
    rerender(<Presentation steps={steps.slice(1)} title="Deck" />)
    expect(container.querySelector('[data-presentation-marker]')).toHaveTextContent('2 / 3')
  })

  it('jumps directly from a progress dot and from a table-of-contents entry', () => {
    window.innerWidth = 1280
    const { container } = render(<Presentation steps={steps} title="Deck" />)
    fireEvent.click(screen.getByRole('button', { name: 'Step 4: Title 4' }))
    expect(root(container)).toHaveAttribute('data-step-index', '3')
    fireEvent.click(within(container.querySelector('[data-presentation-toc]') as HTMLElement).getByRole('button', { name: 'one' }))
    expect(root(container)).toHaveAttribute('data-step-index', '0')
    fireEvent.click(within(container.querySelector('[data-presentation-toc]') as HTMLElement).getByRole('button', { name: 'two' }))
    expect(root(container)).toHaveAttribute('data-step-index', '2')
  })

  it('marks the active dot and table-of-contents entry with aria-current and an active hook', () => {
    window.innerWidth = 1280
    const { container } = render(<Presentation steps={steps} title="Deck" />)
    press('ArrowRight')
    press('ArrowRight')
    const dots = [...container.querySelectorAll('[data-presentation-dot]')]
    expect(dots.map((d) => d.getAttribute('aria-current'))).toEqual([null, null, 'step', null])
    expect(dots.map((d) => d.getAttribute('data-presentation-active'))).toEqual(['false', 'false', 'true', 'false'])
    const toc = [...container.querySelectorAll('[data-presentation-toc-entry]')]
    expect(toc.map((d) => d.getAttribute('aria-current'))).toEqual([null, 'step'])
    expect(toc.map((d) => d.getAttribute('data-presentation-active'))).toEqual(['false', 'true'])
  })

  it('does not advance the deck when a focused control receives navigation keys', () => {
    const { container } = render(<Presentation steps={steps} title="Deck" />)
    const next = screen.getByLabelText('Next step')
    next.focus()
    act(() => void fireEvent.keyDown(next, { key: 'ArrowRight' }))
    act(() => void fireEvent.keyDown(next, { key: ' ' }))
    expect(root(container)).toHaveAttribute('data-step-index', '0')
  })

  it('shows the and-scene attribution bottom-right with a hook, and no default brand', () => {
    const { container } = render(<Presentation steps={steps} title="Deck" />)
    const link = screen.getByRole('link', { name: 'made by and-scene' })
    expect(link).toHaveAttribute('href', 'https://github.com/and-scene/and-scene')
    expect(link).toHaveAttribute('data-presentation-attribution')
    expect(container.querySelector('[data-presentation-footer]')).toContainElement(link)
    const header = container.querySelector('[data-presentation-header]') as HTMLElement
    expect(within(header).queryByRole('link')).toBeNull()
    expect(container.querySelector('[data-presentation-brand]')).toBeNull()
  })

  it('renders host branding and a custom or hidden attribution when asked', () => {
    const { container, rerender } = render(
      <Presentation steps={steps} title="Deck" brand={<a href="/">Acme</a>} attribution={{ label: 'by me', href: 'https://example.com' }} />,
    )
    expect(container.querySelector('[data-presentation-brand]')).toHaveTextContent('Acme')
    expect(screen.getByRole('link', { name: 'by me' })).toBeInTheDocument()
    rerender(<Presentation steps={steps} title="Deck" attribution={false} />)
    expect(container.querySelector('[data-presentation-attribution]')).toBeNull()
  })

  it('uses the 880 x 380 canvas by default and honours an override', () => {
    const { container, rerender } = render(<Presentation steps={steps} title="Deck" />)
    const canvas = () => container.querySelector('[data-presentation-canvas]') as HTMLElement
    expect(canvas().style.width).toBe('880px')
    expect(canvas().style.height).toBe('380px')
    rerender(<Presentation steps={steps} title="Deck" canvas={{ width: 400, height: 200 }} />)
    expect(canvas().style.width).toBe('400px')
  })
})

describe('Stage scene persistence and entity transitions', () => {
  it('keeps one scene instance across grouped steps and remounts for a different group', async () => {
    mounts = 0
    const { container } = render(<Presentation steps={steps} title="Deck" />)
    expect(mounts).toBe(1)
    press('ArrowRight')
    press('ArrowRight')
    expect(mounts).toBe(1)
    expect(container.querySelectorAll('[data-presentation-scene="g"]')).toHaveLength(1)
    press('ArrowRight')
    await waitFor(() => expect(mounts).toBe(2))
    await waitFor(() => expect(container.querySelectorAll('[data-presentation-scene]')).toHaveLength(1))
  })

  it('keeps a continuing entity in place without re-fading it, fades newcomers in, and removes leavers', async () => {
    const { container } = render(<Presentation steps={steps} title="Deck" />)
    const entity = (id: string) => container.querySelector(`[data-presentation-entity="${id}"]`) as HTMLElement | null
    await waitFor(() => expect(entity('a')?.style.opacity).toBe('1'))
    const a = entity('a')
    press('ArrowRight')
    // Newcomer b mounts hidden (it waits for persisting entities); a is the same node, still opaque.
    expect(entity('b')?.style.opacity).toBe('0')
    expect(entity('a')).toBe(a)
    expect(entity('a')?.style.opacity).toBe('1')
    await waitFor(() => expect(entity('b')?.style.opacity).toBe('1'))
    press('ArrowRight')
    // Leaving entity a is removed after its exit; b continues as the same node.
    const b = entity('b')
    await waitFor(() => expect(entity('a')).toBeNull())
    expect(entity('b')).toBe(b)
  })
})
