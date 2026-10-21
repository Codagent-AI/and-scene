// @vitest-environment jsdom
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { key, setViewport } from '../../tests/helpers/events.ts'
import { makeSteps } from '../../tests/helpers/fixtures.tsx'
import { ATTRIBUTION_URL, DESIGN_H, DESIGN_W } from './constants.ts'
import { Presentation } from './Presentation.tsx'
import { buildToc } from './chrome/buildToc.ts'

const root = () => document.querySelector('[data-presentation-root]')!
const q = (selector: string) => document.querySelector(selector)
const stepTitle = () => q('[data-presentation-step-title]')?.textContent

beforeEach(() => setViewport(1440, 900))

describe('an empty step list', () => {
  it('renders nothing instead of crashing', () => {
    const { container } = render(<Presentation steps={[]} title="Deck" />)
    expect(container.childElementCount).toBe(0)
  })
})

describe('present and browse chrome', () => {
  it('present mode shows the marker and one-line title only', () => {
    render(<Presentation steps={makeSteps(4)} title="Deck" initialMode="present" />)
    expect(q('[data-presentation-marker-number]')?.textContent).toBe('01')
    expect(stepTitle()).toBe('Title 1')
    expect(q('[data-presentation-caption]')).toBeNull()
    expect(q('[data-presentation-toc]')).toBeNull()
    expect(q('[data-presentation-nav-prev]')).toBeNull()
    expect(q('[data-presentation-nav-next]')).toBeNull()
    expect(q('[data-presentation-progress]')).toBeNull()
  })

  it('browse mode shows title, caption, progress, prev/next and the ToC on wide viewports', () => {
    render(<Presentation steps={makeSteps(4)} title="Deck" initialMode="browse" />)
    expect(stepTitle()).toBe('Title 1')
    expect(q('[data-presentation-caption]')?.textContent).toBe('Caption 1')
    expect(q('[data-presentation-deck-title]')?.textContent).toBe('Deck')
    expect(document.querySelectorAll('[data-presentation-progress-dot]')).toHaveLength(4)
    expect(q('[data-presentation-nav-prev]')).not.toBeNull()
    expect(q('[data-presentation-nav-next]')).not.toBeNull()
    expect(q('[data-presentation-toc]')).not.toBeNull()
  })

  it('shows the ToC at 1024px and hides it at 1023px, following resizes', () => {
    setViewport(1023, 900)
    render(<Presentation steps={makeSteps(4)} title="Deck" />)
    expect(q('[data-presentation-toc]')).toBeNull()
    expect(q('[data-presentation-progress]')).not.toBeNull()
    expect(q('[data-presentation-caption]')).not.toBeNull()
    setViewport(1024, 900)
    expect(q('[data-presentation-toc]')).not.toBeNull()
    setViewport(900, 900)
    expect(q('[data-presentation-toc]')).toBeNull()
  })

  it('defaults to browse and honors a declared initial mode', () => {
    const { unmount } = render(<Presentation steps={makeSteps(2)} title="Deck" />)
    expect(root().getAttribute('data-presentation-mode')).toBe('browse')
    unmount()
    render(<Presentation steps={makeSteps(2)} title="Deck" initialMode="present" />)
    expect(root().getAttribute('data-presentation-mode')).toBe('present')
  })

  it('toggling the mode keeps the step and swaps the chrome', () => {
    render(<Presentation steps={makeSteps(5)} title="Deck" />)
    fireEvent.click(document.querySelectorAll('[data-presentation-progress-dot]')[2])
    key(document.body, 'p')
    expect(root().getAttribute('data-presentation-mode')).toBe('present')
    expect(root().getAttribute('data-step-index')).toBe('2')
    expect(stepTitle()).toBe('Title 3')
    expect(q('[data-presentation-caption]')).toBeNull()
    key(document.body, 'p')
    expect(root().getAttribute('data-step-index')).toBe('2')
    expect(q('[data-presentation-caption]')?.textContent).toBe('Caption 3')
  })
})

describe('step hooks and numbering', () => {
  it('exposes zero-based data-step-index and data-step-count through navigation and jumps', () => {
    render(<Presentation steps={makeSteps(5)} title="Deck" />)
    const state = () => [root().getAttribute('data-step-count'), root().getAttribute('data-step-index')]
    expect(state()).toEqual(['5', '0'])
    fireEvent.click(screen.getByLabelText('Next step'))
    expect(state()).toEqual(['5', '1'])
    fireEvent.click(screen.getByLabelText('Previous step'))
    expect(state()).toEqual(['5', '0'])
    fireEvent.click(document.querySelectorAll('[data-presentation-progress-dot]')[4])
    expect(state()).toEqual(['5', '4'])
    key(document.body, 'p')
    expect(state()).toEqual(['5', '4'])
  })

  it('derives on-screen numbers from position when steps are inserted, removed, or reordered', () => {
    const steps = makeSteps(3)
    const { rerender } = render(<Presentation steps={steps} title="Deck" initialMode="browse" />)
    const marker = () => [q('[data-presentation-marker-number]')?.textContent, q('[data-presentation-marker-total]')?.textContent]
    key(document.body, 'ArrowRight')
    expect(marker()).toEqual(['02', '/ 03'])
    const extra = { ...steps[0], id: 'extra', title: 'Inserted' }
    rerender(<Presentation steps={[extra, ...steps]} title="Deck" />)
    expect(marker()).toEqual(['02', '/ 04'])
    rerender(<Presentation steps={[steps[2], steps[1], steps[0]]} title="Deck" />)
    expect(stepTitle()).toBe('Title 2')
    expect(marker()).toEqual(['02', '/ 03'])
    rerender(<Presentation steps={[steps[2]]} title="Deck" />)
    expect(marker()).toEqual(['01', '/ 01'])
    expect(document.querySelectorAll('[data-presentation-progress-dot]')).toHaveLength(1)
  })

  it('passes each step its payload and index', () => {
    render(<Presentation steps={makeSteps(3)} title="Deck" />)
    expect(screen.getByTestId('scene').textContent).toBe('state 1')
    key(document.body, 'ArrowRight')
    expect(screen.getByTestId('scene').textContent).toBe('state 2')
  })
})

describe('navigation controls', () => {
  it('walks a fixture forwards and backwards by caption and clamps at both ends', () => {
    render(<Presentation steps={makeSteps(3)} title="Deck" />)
    const caption = () => q('[data-presentation-caption]')?.textContent
    const prev = screen.getByLabelText('Previous step') as HTMLButtonElement
    const next = screen.getByLabelText('Next step') as HTMLButtonElement
    expect(prev.disabled).toBe(true)
    fireEvent.click(prev)
    expect(caption()).toBe('Caption 1')
    fireEvent.click(next)
    fireEvent.click(next)
    expect(caption()).toBe('Caption 3')
    expect(next.disabled).toBe(true)
    fireEvent.click(next)
    expect(caption()).toBe('Caption 3')
    fireEvent.click(prev)
    expect(caption()).toBe('Caption 2')
  })

  it('does not double-advance when a focused control handles its own key', () => {
    render(<Presentation steps={makeSteps(4)} title="Deck" />)
    key(screen.getByLabelText('Next step'), 'ArrowRight')
    expect(root().getAttribute('data-step-index')).toBe('0')
  })

  it('jumps via progress dots and the ToC (to the first step of the era)', () => {
    render(<Presentation steps={makeSteps(5, ['a', 'a', 'b', 'b', 'b'])} title="Deck" />)
    fireEvent.click(document.querySelectorAll('[data-presentation-progress-dot]')[3])
    expect(stepTitle()).toBe('Title 4')
    fireEvent.click(within(q('[data-presentation-toc]') as HTMLElement).getByText('a'))
    expect(stepTitle()).toBe('Title 1')
    fireEvent.click(within(q('[data-presentation-toc]') as HTMLElement).getByText('b'))
    expect(stepTitle()).toBe('Title 3')
  })

  it('marks exactly one active dot and era with semantic and hook state that follow navigation', () => {
    render(<Presentation steps={makeSteps(5, ['a', 'a', 'b', 'b', 'b'])} title="Deck" />)
    const state = (selector: string) =>
      [...document.querySelectorAll(selector)].map((el) => [el.getAttribute('aria-current'), el.getAttribute('data-presentation-active')])
    const check = (dot: number, era: number) => {
      const dots = state('[data-presentation-progress-dot]')
      dots.forEach(([current, active], i) => {
        expect(current).toBe(i === dot ? 'step' : null)
        expect(active).toBe(i === dot ? 'true' : 'false')
      })
      state('[data-presentation-toc-entry]').forEach(([current, active], i) => {
        expect(current).toBe(i === era ? 'true' : null)
        expect(active).toBe(i === era ? 'true' : 'false')
      })
    }
    check(0, 0)
    key(document.body, 'ArrowRight')
    key(document.body, 'ArrowRight')
    check(2, 1)
    fireEvent.click(document.querySelectorAll('[data-presentation-progress-dot]')[1])
    check(1, 0)
  })
})

describe('Toc grouping', () => {
  it('renders an era that repeats non-consecutively without duplicate React keys', () => {
    const errors: unknown[][] = []
    const spy = vi.spyOn(console, 'error').mockImplementation((...args) => void errors.push(args))
    render(<Presentation steps={makeSteps(5, ['a', 'a', 'b', 'a', 'a'])} title="Deck" />)
    spy.mockRestore()
    expect(errors).toEqual([])
    expect(document.querySelectorAll('[data-presentation-toc-entry]')).toHaveLength(3)
  })

  it('groups consecutive steps sharing an era and marks the active era', () => {
    expect(buildToc(makeSteps(5, ['a', 'a', 'b', 'a', 'a']), 3)).toEqual([
      { era: 'a', start: 0, active: false },
      { era: 'b', start: 2, active: false },
      { era: 'a', start: 3, active: true },
    ])
  })
})

describe('attribution and brand', () => {
  it.each(['browse', 'present'] as const)('shows the default bottom-right attribution in %s mode', (mode) => {
    render(<Presentation steps={makeSteps(2)} title="Deck" initialMode={mode} />)
    const link = q('[data-presentation-attribution]') as HTMLAnchorElement
    expect(link.textContent).toBe('made by and-scene')
    expect(link.getAttribute('href')).toBe(ATTRIBUTION_URL)
    expect(ATTRIBUTION_URL).toBe('https://github.com/Codagent-AI/and-scene')
    expect(link.getAttribute('target')).toBe('_blank')
    expect(link.getAttribute('rel')).toBe('noopener noreferrer')
    expect(link.parentElement).toBe(root())
    expect(link.style).toMatchObject({ position: 'absolute', right: '0px', bottom: '0px' })
  })

  it('can replace or omit the attribution', () => {
    const { unmount } = render(<Presentation steps={makeSteps(2)} title="Deck" attribution="custom" />)
    expect(q('[data-presentation-attribution]')?.textContent).toBe('custom')
    unmount()
    render(<Presentation steps={makeSteps(2)} title="Deck" attribution={false} />)
    expect(q('[data-presentation-attribution]')).toBeNull()
  })

  it('leaves the top-left slot empty unless the host supplies a brand', () => {
    const { unmount } = render(<Presentation steps={makeSteps(2)} title="Deck" />)
    const slot = q('[data-presentation-brand-slot]') as HTMLElement
    expect(slot.childElementCount).toBe(0)
    expect(slot.textContent).toBe('')
    expect(q('[data-presentation-header] a')).toBeNull()
    unmount()
    render(<Presentation steps={makeSteps(2)} title="Deck" brand={<span>Acme</span>} />)
    expect((q('[data-presentation-brand-slot]') as HTMLElement).textContent).toBe('Acme')
    expect(q('[data-presentation-attribution]')?.textContent).toBe('made by and-scene')
  })
})

describe('canvas', () => {
  it('uses the default 880 x 380 canvas with one uniform scale', () => {
    render(<Presentation steps={makeSteps(2)} title="Deck" />)
    const canvas = q('[data-presentation-canvas]') as HTMLElement
    expect(canvas.style.width).toBe(`${DESIGN_W}px`)
    expect(canvas.style.height).toBe(`${DESIGN_H}px`)
    expect(canvas.style.transform).toMatch(/^scale\([\d.]+\)$/)
    expect(Number(canvas.dataset.presentationScale)).toBeGreaterThan(0)
  })

  it('keeps the scale across steps at a fixed viewport and recomputes on resize', () => {
    render(<Presentation steps={makeSteps(4)} title="Deck" />)
    const scale = () => (q('[data-presentation-canvas]') as HTMLElement).style.transform
    const first = scale()
    key(document.body, 'ArrowRight')
    key(document.body, 'ArrowRight')
    expect(scale()).toBe(first)
    setViewport(800, 900)
    act(() => undefined)
    expect(scale()).not.toBe(first)
  })

  it('switching modes remounts the stage instead of morphing the scene', () => {
    render(<Presentation steps={makeSteps(2)} title="Deck" />)
    const before = q('[data-presentation-stage]')
    key(document.body, 'p')
    expect(q('[data-presentation-stage]')).not.toBe(before)
  })
})
