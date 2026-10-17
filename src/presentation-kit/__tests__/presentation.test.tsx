import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useEffect } from 'react'
import { describe, expect, expectTypeOf, it } from 'vitest'
import { Presentation, type SceneProps, type Step } from '../index.ts'

function Plain() {
  return <div data-testid="scene" />
}

const make = (n: number, era = `era ${Math.ceil(n / 2)}`): Step => ({
  id: `s${n}`,
  era,
  title: `Title ${n}`,
  caption: `Caption ${n}`,
  Scene: Plain,
})

const steps = [1, 2, 3, 4].map((n) => make(n))
const root = (container: HTMLElement) => container.querySelector('[data-presentation-root]')!

describe('chrome per mode', () => {
  it('present mode shows marker and one-line title only', () => {
    const { container } = render(<Presentation steps={steps} initialMode="present" />)
    expect(container.querySelector('[data-presentation-marker]')?.textContent).toBe('01')
    expect(container.querySelector('[data-presentation-title]')?.textContent).toBe('Title 1')
    for (const hidden of ['caption', 'toc', 'prev', 'next', 'progress']) {
      expect(container.querySelector(`[data-presentation-${hidden}]`)).toBeNull()
    }
  })

  it('browse mode shows title, caption, ToC, progress and prev/next', () => {
    const { container } = render(<Presentation steps={steps} initialMode="browse" title="Deck" />)
    expect(container.querySelector('[data-presentation-caption]')?.textContent).toBe('Caption 1')
    expect(container.querySelector('[data-presentation-toc]')).not.toBeNull()
    expect(container.querySelector('[data-presentation-prev]')).not.toBeNull()
    expect(container.querySelector('[data-presentation-next]')).not.toBeNull()
    expect(container.querySelectorAll('[data-presentation-progress-item]')).toHaveLength(4)
    expect(container.querySelector('[data-presentation-deck-title]')?.textContent).toBe('Deck')
  })

  it('opens in browse mode by default', () => {
    const { container } = render(<Presentation steps={steps} />)
    expect(root(container).getAttribute('data-presentation-mode')).toBe('browse')
  })

  it('toggles mode with P and stays on the current step', () => {
    const { container } = render(<Presentation steps={steps} />)
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    fireEvent.keyDown(window, { key: 'p' })
    expect(root(container).getAttribute('data-presentation-mode')).toBe('present')
    expect(root(container).getAttribute('data-presentation-step-index')).toBe('1')
    expect(container.querySelector('[data-presentation-title]')?.textContent).toBe('Title 2')
    fireEvent.keyDown(window, { key: 'p' })
    expect(root(container).getAttribute('data-presentation-step-index')).toBe('1')
  })

  it('hides the ToC on narrow viewports', () => {
    const original = window.matchMedia
    window.matchMedia = (() => ({ matches: false, addEventListener() {}, removeEventListener() {} })) as never
    const { container } = render(<Presentation steps={steps} />)
    window.matchMedia = original
    expect(container.querySelector('[data-presentation-toc]')).toBeNull()
    expect(container.querySelector('[data-presentation-progress]')).not.toBeNull()
  })
})

describe('step hooks and numbering', () => {
  it('exposes canonical and alias count/index hooks in both modes', () => {
    const { container } = render(<Presentation steps={steps} initialMode="present" />)
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    const el = root(container)
    for (const prefix of ['data-presentation-', 'data-']) {
      expect(el.getAttribute(`${prefix}step-count`)).toBe('4')
      expect(el.getAttribute(`${prefix}step-index`)).toBe('1')
    }
  })

  it('derives numbers from position when steps are inserted or reordered', () => {
    const { container, rerender } = render(<Presentation steps={steps} />)
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(container.querySelector('[data-presentation-marker]')?.textContent).toBe('02')
    const reordered = [steps[0], make(9), ...steps.slice(1)]
    rerender(<Presentation steps={reordered} />)
    expect(container.querySelector('[data-presentation-title]')?.textContent).toBe('Title 9')
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(container.querySelector('[data-presentation-marker]')?.textContent).toBe('03')
    expect(container.querySelector('[data-presentation-title]')?.textContent).toBe('Title 2')
  })
})

describe('order-derived numbering', () => {
  const markerAndTitle = (container: HTMLElement) => [
    container.querySelector('[data-presentation-marker]')?.textContent,
    container.querySelector('[data-presentation-title]')?.textContent,
  ]

  it('renumbers after removing or reordering steps', () => {
    const { container, rerender } = render(<Presentation steps={steps} />)
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(markerAndTitle(container)).toEqual(['02', 'Title 2'])
    rerender(<Presentation steps={[steps[0], steps[2], steps[3]]} />)
    expect(markerAndTitle(container)).toEqual(['02', 'Title 3'])
    rerender(<Presentation steps={[steps[3], steps[2], steps[0]]} />)
    expect(markerAndTitle(container)).toEqual(['02', 'Title 3'])
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(markerAndTitle(container)).toEqual(['03', 'Title 1'])
    expect(root(container).getAttribute('data-presentation-step-count')).toBe('3')
  })
})

describe('navigation controls', () => {
  it('jumps via progress indicators and exposes current-step semantics', () => {
    const { container } = render(<Presentation steps={steps} />)
    fireEvent.click(screen.getByLabelText('Step 3: Title 3'))
    expect(root(container).getAttribute('data-presentation-step-index')).toBe('2')
    const items = [...container.querySelectorAll('[data-presentation-progress-item]')]
    items.forEach((item, i) => {
      expect(item.getAttribute('aria-current')).toBe(i === 2 ? 'step' : null)
      expect(item.getAttribute('data-presentation-active')).toBe(i === 2 ? 'true' : null)
    })
  })

  it('jumps to the first step of a section via the ToC', () => {
    const { container } = render(<Presentation steps={steps} />)
    fireEvent.keyDown(window, { key: 'PageDown' })
    fireEvent.keyDown(window, { key: 'PageDown' })
    fireEvent.keyDown(window, { key: 'PageDown' })
    const entries = [...container.querySelectorAll('[data-presentation-toc-item]')]
    expect(entries.map((e) => e.textContent)).toEqual(['era 1', 'era 2'])
    expect(entries[1].getAttribute('aria-current')).toBe('true')
    expect(entries[1].getAttribute('data-presentation-active')).toBe('true')
    expect(entries[0].getAttribute('aria-current')).toBeNull()
    expect(entries[0].getAttribute('data-presentation-active')).toBeNull()
    fireEvent.click(entries[1])
    expect(root(container).getAttribute('data-presentation-step-index')).toBe('2')
    fireEvent.click(entries[0])
    expect(root(container).getAttribute('data-presentation-step-index')).toBe('0')
  })

  it('prev/next buttons clamp at the ends', () => {
    const { container } = render(<Presentation steps={steps} />)
    const prev = container.querySelector<HTMLButtonElement>('[data-presentation-prev]')!
    const next = container.querySelector<HTMLButtonElement>('[data-presentation-next]')!
    expect(prev.disabled).toBe(true)
    for (let i = 0; i < 5; i++) fireEvent.click(next)
    expect(root(container).getAttribute('data-presentation-step-index')).toBe('3')
    expect(next.disabled).toBe(true)
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(root(container).getAttribute('data-presentation-step-index')).toBe('3')
  })

  it('does not advance the deck when Space hits a focused control', () => {
    const { container } = render(<Presentation steps={steps} />)
    const dot = container.querySelector<HTMLButtonElement>('[data-presentation-progress-item]')!
    fireEvent.keyDown(dot, { key: ' ' })
    expect(root(container).getAttribute('data-presentation-step-index')).toBe('0')
  })
})

describe('attribution and branding', () => {
  it('shows the default bottom-right attribution with a styling hook', () => {
    const { container } = render(<Presentation steps={steps} />)
    const link = container.querySelector<HTMLAnchorElement>('[data-presentation-attribution]')!
    expect(link.textContent).toBe('made by and-scene')
    expect(link.href).toBe('https://github.com/Codagent-AI/and-scene')
    expect(link.style.position).toBe('fixed')
    expect(link.style.right).toBe('0px')
    expect(link.style.bottom).toBe('0px')
  })

  it('leaves the top-left brand slot empty unless the host provides one', () => {
    const { container, rerender } = render(<Presentation steps={steps} />)
    const brand = () => container.querySelector('[data-presentation-brand]')!
    expect(brand().children).toHaveLength(0)
    expect(brand().textContent).toBe('')
    rerender(<Presentation steps={steps} brand={<a href="/">host</a>} />)
    expect(brand().textContent).toBe('host')
  })

  it('allows overriding or omitting attribution', () => {
    const { container, rerender } = render(
      <Presentation steps={steps} attribution={{ label: 'mine', href: 'https://example.com/' }} />,
    )
    expect(container.querySelector('[data-presentation-attribution]')?.textContent).toBe('mine')
    rerender(<Presentation steps={steps} attribution={false} />)
    expect(container.querySelector('[data-presentation-attribution]')).toBeNull()
  })
})

describe('grouped scenes', () => {
  it('keeps one mounted scene instance across grouped steps and remounts across groups', async () => {
    const mounts: string[] = []
    function Counting({ payload }: SceneProps<{ n: number }>) {
      useEffect(() => {
        mounts.push('mount')
      }, [])
      return <div data-testid="counting">{payload.n}</div>
    }
    const grouped: Step<{ n: number }>[] = [1, 2, 3].map((n) => ({
      ...make(n),
      Scene: Counting,
      groupKey: n < 3 ? 'a' : 'b',
      payload: { n },
    }))
    render(<Presentation steps={grouped} />)
    expect(mounts).toHaveLength(1)
    act(() => fireEvent.keyDown(window, { key: 'ArrowRight' }))
    expect(mounts).toHaveLength(1)
    expect(screen.getByTestId('counting').textContent).toBe('2')
    act(() => fireEvent.keyDown(window, { key: 'ArrowRight' }))
    await waitFor(() => expect(mounts).toHaveLength(2))
  })

  it('accepts typed grouped payloads without casts', () => {
    interface Payload {
      beat: number
    }
    const Typed = ({ payload }: SceneProps<Payload>) => <div>{payload.beat}</div>
    const typed: Step<Payload>[] = [{ ...make(1), Scene: Typed, groupKey: 'g', payload: { beat: 1 } }]
    expectTypeOf(typed).toEqualTypeOf<Step<Payload>[]>()
    expectTypeOf(Presentation<Payload>).parameter(0).toHaveProperty('steps')
    const { container } = render(<Presentation steps={typed} />)
    expect(container.textContent).toContain('1')
  })

  it('does not require a payload for plain steps', () => {
    expectTypeOf(make(1)).toEqualTypeOf<Step>()
  })
})
