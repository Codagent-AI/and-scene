import { act, fireEvent, render, within } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { Presentation, WIDE_VIEWPORT, type AnyStep } from '../../src/presentation-kit'
import { makeSteps, setViewport } from './helpers'

const q = (sel: string, root: ParentNode = document) => root.querySelector<HTMLElement>(sel)
const all = (sel: string, root: ParentNode = document) => [...root.querySelectorAll<HTMLElement>(sel)]
const key = (k: string) => act(() => void window.dispatchEvent(new KeyboardEvent('keydown', { key: k, cancelable: true })))
const root = () => q('[data-presentation-root]')!

beforeEach(() => setViewport(1440, 900))

describe('Presentation chrome', () => {
  it('shows marker and one-line title in present mode, with caption, ToC, and prev/next absent', () => {
    const steps = makeSteps(5)
    render(<Presentation steps={steps} title="Deck" initialMode="present" />)
    expect(q('[data-presentation-marker]')!.textContent).toBe('1 / 5')
    expect(q('[data-presentation-step-title]')!.textContent).toBe('Title 0')
    const line = q('[data-presentation-title-line]')!
    expect(line.style.whiteSpace).toBe('nowrap')
    expect(q('[data-presentation-caption]')).toBeNull()
    expect(q('[data-presentation-chrome="toc"]')).toBeNull()
    expect(q('[data-presentation-prev]')).toBeNull()
    expect(q('[data-presentation-next]')).toBeNull()
    expect(q('[data-presentation-progress-item]')).toBeNull()
    key('ArrowRight')
    key('ArrowRight')
    expect(q('[data-presentation-marker]')!.textContent).toBe('3 / 5')
    expect(q('[data-presentation-step-title]')!.textContent).toBe('Title 2')
    expect(q('[data-presentation-caption]')).toBeNull()
  })

  it('shows title, multi-line caption, ToC, prev/next, and progress dots in browse mode', () => {
    render(<Presentation steps={makeSteps(5)} title="Deck" initialMode="browse" />)
    expect(q('[data-presentation-step-title]')!.textContent).toBe('Title 0')
    expect(q('[data-presentation-caption]')!.textContent).toBe('Caption 0')
    expect(q('[data-presentation-caption]')!.style.whiteSpace).toBe('normal')
    expect(q('[data-presentation-chrome="toc"]')).not.toBeNull()
    expect(q('[data-presentation-prev]')).not.toBeNull()
    expect(q('[data-presentation-next]')).not.toBeNull()
    expect(all('[data-presentation-progress-item]')).toHaveLength(5)
    expect(q('[data-presentation-deck-title]')!.textContent).toBe('Deck')
  })

  it('defaults to browse when no initial mode is given', () => {
    render(<Presentation steps={makeSteps(2)} title="Deck" />)
    expect(root().getAttribute('data-presentation-mode')).toBe('browse')
    expect(q('[data-presentation-caption]')).not.toBeNull()
  })

  it('shows the ToC only at or above the wide threshold', () => {
    render(<Presentation steps={makeSteps(4)} title="Deck" />)
    act(() => setViewport(WIDE_VIEWPORT - 1))
    expect(q('[data-presentation-chrome="toc"]')).toBeNull()
    expect(q('[data-presentation-prev]')).not.toBeNull()
    act(() => setViewport(WIDE_VIEWPORT))
    expect(q('[data-presentation-chrome="toc"]')).not.toBeNull()
    act(() => setViewport(WIDE_VIEWPORT + 400))
    expect(q('[data-presentation-chrome="toc"]')).not.toBeNull()
  })

  it('toggles mode with P and keeps the current step each time', () => {
    render(<Presentation steps={makeSteps(5)} title="Deck" />)
    key('ArrowRight')
    key('ArrowRight')
    key('p')
    expect(root().getAttribute('data-presentation-mode')).toBe('present')
    expect(root().getAttribute('data-step-index')).toBe('2')
    expect(q('[data-presentation-caption]')).toBeNull()
    key('p')
    expect(root().getAttribute('data-presentation-mode')).toBe('browse')
    expect(root().getAttribute('data-step-index')).toBe('2')
    expect(q('[data-presentation-caption]')!.textContent).toBe('Caption 2')
  })

  it('exposes accurate step-count and step-index hooks in both modes', () => {
    render(<Presentation steps={makeSteps(7)} title="Deck" />)
    expect(root().getAttribute('data-step-count')).toBe('7')
    expect(root().getAttribute('data-step-index')).toBe('0')
    key('ArrowRight')
    expect(root().getAttribute('data-step-index')).toBe('1')
    key('p')
    expect(root().getAttribute('data-step-count')).toBe('7')
    key('ArrowRight')
    expect(root().getAttribute('data-step-index')).toBe('2')
    key('p')
    fireEvent.click(all('[data-presentation-progress-item]')[5])
    expect(root().getAttribute('data-step-index')).toBe('5')
    expect(root().getAttribute('data-step-count')).toBe('7')
  })

  it('derives the displayed marker from position after steps are inserted, removed, or reordered', () => {
    const steps = makeSteps(3)
    const { rerender } = render(<Presentation steps={steps} title="Deck" initialMode="present" />)
    expect(q('[data-presentation-marker]')!.textContent).toBe('1 / 3')
    const [a, b, c] = steps
    const extra: AnyStep = { ...a, id: 'extra', title: 'Inserted' }
    rerender(<Presentation steps={[extra, a, b, c]} title="Deck" initialMode="present" />)
    expect(q('[data-presentation-marker]')!.textContent).toBe('1 / 4')
    key('ArrowRight')
    expect(q('[data-presentation-marker]')!.textContent).toBe('2 / 4')
    expect(q('[data-presentation-step-title]')!.textContent).toBe('Title 0')
    rerender(<Presentation steps={[c, b]} title="Deck" initialMode="present" />)
    expect(q('[data-presentation-marker]')!.textContent).toBe('2 / 2')
    expect(q('[data-presentation-step-title]')!.textContent).toBe('Title 1')
  })

  it('throws a descriptive error for invalid steps', () => {
    const [step] = makeSteps(1)
    const spy = console.error
    console.error = () => {}
    try {
      expect(() => render(<Presentation steps={[{ ...step, caption: '' }]} title="Deck" />)).toThrow(/missing caption/)
    } finally {
      console.error = spy
    }
  })
})

describe('direct jump and active state', () => {
  it('jumps from a dot to its step and from a ToC entry to the first step of its era', () => {
    render(<Presentation steps={makeSteps(6)} title="Deck" />)
    fireEvent.click(all('[data-presentation-progress-item]')[4])
    expect(root().getAttribute('data-step-index')).toBe('4')
    expect(q('[data-presentation-caption]')!.textContent).toBe('Caption 4')
    const toc = all('[data-presentation-toc-item]')
    expect(toc.map((t) => t.textContent)).toEqual(['era-0', 'era-1', 'era-2'])
    fireEvent.click(toc[1])
    expect(root().getAttribute('data-step-index')).toBe('2')
    expect(q('[data-presentation-caption]')!.textContent).toBe('Caption 2')
    fireEvent.click(toc[2])
    expect(root().getAttribute('data-step-index')).toBe('4')
  })

  it('marks only the active dot and ToC entry with aria-current and the active hook', () => {
    render(<Presentation steps={makeSteps(6)} title="Deck" />)
    const state = () => ({
      dots: all('[data-presentation-progress-item]').map((d) => [d.getAttribute('aria-current'), d.getAttribute('data-presentation-active')]),
      toc: all('[data-presentation-toc-item]').map((d) => [d.getAttribute('aria-current'), d.getAttribute('data-presentation-active')]),
    })
    const on = ['step', 'true']
    const off = [null, null]
    expect(state().dots).toEqual([on, off, off, off, off, off])
    expect(state().toc).toEqual([on, off, off])
    key('ArrowRight')
    expect(state().dots).toEqual([off, on, off, off, off, off])
    expect(state().toc).toEqual([on, off, off])
    key('ArrowRight')
    expect(state().dots[2]).toEqual(on)
    expect(state().toc).toEqual([off, on, off])
  })

  it('disables prev at the start and next at the end, and the buttons navigate', () => {
    render(<Presentation steps={makeSteps(3)} title="Deck" />)
    const prev = q('[data-presentation-prev]') as HTMLButtonElement
    const next = q('[data-presentation-next]') as HTMLButtonElement
    expect(prev.disabled).toBe(true)
    fireEvent.click(prev)
    expect(root().getAttribute('data-step-index')).toBe('0')
    fireEvent.click(next)
    fireEvent.click(next)
    expect(root().getAttribute('data-step-index')).toBe('2')
    expect(next.disabled).toBe(true)
    fireEvent.click(next)
    expect(root().getAttribute('data-step-index')).toBe('2')
    fireEvent.click(prev)
    expect(root().getAttribute('data-step-index')).toBe('1')
  })

  it('walks forward and back through every step showing each caption', () => {
    const steps = makeSteps(9)
    render(<Presentation steps={steps} title="Deck" />)
    for (let i = 0; i < 9; i++) {
      expect(q('[data-presentation-caption]')!.textContent).toBe(`Caption ${i}`)
      if (i < 8) fireEvent.click(q('[data-presentation-next]')!)
    }
    for (let i = 8; i >= 0; i--) {
      expect(q('[data-presentation-caption]')!.textContent).toBe(`Caption ${i}`)
      if (i > 0) fireEvent.click(q('[data-presentation-prev]')!)
    }
  })

  it('lets a focused control keep its keys instead of advancing the deck', () => {
    render(<Presentation steps={makeSteps(4)} title="Deck" />)
    const dot = all('[data-presentation-progress-item]')[0]
    dot.focus()
    act(() => void dot.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true })))
    expect(root().getAttribute('data-step-index')).toBe('0')
  })
})

describe('attribution and branding', () => {
  it('shows the default bottom-right attribution link with a styling hook', () => {
    render(<Presentation steps={makeSteps(2)} title="Deck" />)
    const link = q('[data-presentation-attribution]') as HTMLAnchorElement
    expect(link.tagName).toBe('A')
    expect(link.textContent).toBe('made by and-scene')
    expect(link.getAttribute('href')).toBe('https://github.com/Codagent-AI/and-scene')
    expect(link.style.right).toBe('0px')
    expect(link.style.bottom).toBe('0px')
    expect(link.style.position).toBe('absolute')
    expect(link.parentElement).toBe(root())
  })

  it('can be overridden or omitted', () => {
    const { rerender } = render(<Presentation steps={makeSteps(2)} title="Deck" attribution={{ label: 'custom', href: 'https://example.com' }} />)
    expect(q('[data-presentation-attribution]')!.textContent).toBe('custom')
    expect(q('[data-presentation-attribution]')!.getAttribute('href')).toBe('https://example.com')
    rerender(<Presentation steps={makeSteps(2)} title="Deck" attribution={false} />)
    expect(q('[data-presentation-attribution]')).toBeNull()
  })

  it('leaves the top-left slot empty by default and renders host branding when supplied', () => {
    const { rerender } = render(<Presentation steps={makeSteps(2)} title="Deck" />)
    const slot = q('[data-presentation-brand-slot]')!
    expect(slot.childElementCount).toBe(0)
    expect(slot.textContent).toBe('')
    expect(within(q('[data-presentation-chrome="header"]')!).queryByText(/and-scene/)).toBeNull()
    rerender(<Presentation steps={makeSteps(2)} title="Deck" brand={<a href="/">Host</a>} />)
    expect(q('[data-presentation-brand-slot]')!.textContent).toBe('Host')
  })

  it('passes className and style through to the root', () => {
    render(<Presentation steps={makeSteps(2)} title="Deck" className="mine" style={{ zIndex: 3 }} />)
    expect(root().classList.contains('mine')).toBe(true)
    expect(root().style.zIndex).toBe('3')
  })
})
