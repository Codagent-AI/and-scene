import { describe, expect, it } from 'vitest'
import { act, fireEvent, render, within } from '@testing-library/react'
import {
  ATTRIBUTION_LABEL, ATTRIBUTION_URL, Presentation, TOC_MIN_WIDTH, type PresentationProps, type Step,
} from '../../src/presentation-kit'
import { currentIndex, makeSteps, press, setViewport } from './helpers'

const q = (selector: string) => document.querySelector<HTMLElement>(selector)
const qa = (selector: string) => Array.from(document.querySelectorAll<HTMLElement>(selector))
/** The active step's scene; an outgoing one may still be fading out. */
const activeScene = () =>
  q(`[data-presentation-scene="${q('[data-step-id]')!.getAttribute('data-step-id')}"] [data-testid="scene"]`)?.textContent
const ERAS = ['one', 'one', 'two', 'two', 'two', 'three']

function renderDeck(props: Partial<PresentationProps<undefined>> = {}, steps: Step[] = makeSteps(ERAS)) {
  return render(<Presentation steps={steps} title="deck" {...props} />)
}

describe('present mode', () => {
  it('shows marker and one-line title; hides caption, ToC and prev/next', () => {
    setViewport(1440, 900)
    renderDeck({ initialMode: 'present' })
    expect(q('[data-presentation-step-number]')!.textContent).toBe('01')
    expect(q('[data-presentation-era]')!.textContent).toBe('one')
    expect(q('[data-presentation-title]')!.textContent).toBe('Title s1')
    expect(q('[data-presentation-title]')!.style.whiteSpace).toBe('nowrap')
    expect(q('[data-presentation-caption]')).toBeNull()
    expect(q('[data-presentation-toc]')).toBeNull()
    expect(q('[data-presentation-prev]')).toBeNull()
    expect(q('[data-presentation-next]')).toBeNull()
  })
})

describe('browse mode', () => {
  it('shows title, caption, prev/next, progress dots and a wide-viewport ToC', () => {
    setViewport(1440, 900)
    renderDeck()
    expect(q('[data-presentation-root]')!.getAttribute('data-presentation-mode')).toBe('browse')
    expect(q('[data-presentation-title]')!.textContent).toBe('Title s1')
    expect(q('[data-presentation-caption]')!.textContent).toBe('Caption s1')
    expect(q('[data-presentation-prev]')).not.toBeNull()
    expect(q('[data-presentation-next]')).not.toBeNull()
    expect(qa('[data-presentation-progress-dot]')).toHaveLength(ERAS.length)
    expect(q('[data-presentation-toc]')).not.toBeNull()
  })

  it('shows the ToC at 1024px and above, not below, and follows resizes', () => {
    setViewport(TOC_MIN_WIDTH - 1, 800)
    renderDeck()
    expect(q('[data-presentation-toc]')).toBeNull()
    setViewport(TOC_MIN_WIDTH, 800)
    expect(q('[data-presentation-toc]')).not.toBeNull()
    setViewport(600, 800)
    expect(q('[data-presentation-toc]')).toBeNull()
  })

  it('lets a multi-line caption wrap (no nowrap rule)', () => {
    setViewport(1440, 900)
    renderDeck()
    expect(q('[data-presentation-caption]')!.style.whiteSpace).toBe('')
  })

  it('switches modes at runtime on the same step with the right chrome', () => {
    setViewport(1440, 900)
    renderDeck()
    press('ArrowRight')
    press('ArrowRight')
    act(() => void press('p'))
    expect(currentIndex()).toBe(2)
    expect(q('[data-presentation-caption]')).toBeNull()
    expect(q('[data-presentation-title]')!.textContent).toBe('Title s3')
    act(() => void press('p'))
    expect(currentIndex()).toBe(2)
    expect(q('[data-presentation-caption]')!.textContent).toBe('Caption s3')
  })

  it('also toggles from the on-screen control', () => {
    setViewport(1440, 900)
    renderDeck()
    fireEvent.click(q('[data-presentation-mode-toggle]')!)
    expect(q('[data-presentation-root]')!.getAttribute('data-presentation-mode')).toBe('present')
  })
})

describe('direct jumps and active semantics', () => {
  it('jumps via progress dots and to the first step of an era via the ToC', () => {
    setViewport(1440, 900)
    renderDeck()
    fireEvent.click(qa('[data-presentation-progress-dot]')[4])
    expect(currentIndex()).toBe(4)
    expect(activeScene()).toBe('s5')
    fireEvent.click(qa('[data-presentation-toc-entry]')[1]) // era "two"
    expect(currentIndex()).toBe(2)
    expect(activeScene()).toBe('s3')
    fireEvent.click(qa('[data-presentation-toc-entry]')[0])
    expect(currentIndex()).toBe(0)
    fireEvent.click(qa('[data-presentation-toc-entry]')[0]) // repeated current-era jump
    expect(currentIndex()).toBe(0)
  })

  it('exposes aria-current and the active hook only on the current dot and ToC entry', () => {
    setViewport(1440, 900)
    renderDeck()
    const check = (dot: number, toc: number) => {
      const dots = qa('[data-presentation-progress-dot]')
      const entries = qa('[data-presentation-toc-entry]')
      expect(dots.map((d) => d.getAttribute('aria-current'))).toEqual(dots.map((_, i) => (i === dot ? 'step' : null)))
      expect(dots.map((d) => d.hasAttribute('data-presentation-active'))).toEqual(dots.map((_, i) => i === dot))
      expect(entries.map((e) => e.getAttribute('aria-current'))).toEqual(entries.map((_, i) => (i === toc ? 'step' : null)))
      expect(entries.map((e) => e.hasAttribute('data-presentation-active'))).toEqual(entries.map((_, i) => i === toc))
    }
    check(0, 0)
    act(() => void press('ArrowRight')) // within era
    check(1, 0)
    act(() => void press('ArrowRight')) // between eras
    check(2, 1)
    fireEvent.click(qa('[data-presentation-progress-dot]')[5])
    check(5, 2)
  })

  it('disables prev at the start and next at the end', () => {
    setViewport(1440, 900)
    renderDeck()
    expect((q('[data-presentation-prev]') as HTMLButtonElement).disabled).toBe(true)
    fireEvent.click(qa('[data-presentation-progress-dot]')[5])
    expect((q('[data-presentation-next]') as HTMLButtonElement).disabled).toBe(true)
  })

  it('moves to neighbouring steps from next/previous controls', () => {
    setViewport(1440, 900)
    renderDeck()
    fireEvent.click(q('[data-presentation-next]')!)
    expect(activeScene()).toBe('s2')
    fireEvent.click(q('[data-presentation-prev]')!)
    expect(activeScene()).toBe('s1')
  })
})

describe('order-derived numbering and hooks', () => {
  const marker = () => q('[data-presentation-step-number]')!.textContent
  const base = makeSteps(['a', 'a', 'b'])

  it('derives numbers from position after insertion, removal and reordering', () => {
    setViewport(1440, 900)
    const { rerender } = renderDeck({}, base)
    fireEvent.click(qa('[data-presentation-progress-dot]')[2])
    expect(marker()).toBe('03')
    expect(q('[data-step-count]')!.getAttribute('data-step-count')).toBe('3')

    const inserted = [base[0], makeSteps(['z'], 'n')[0], base[1], base[2]]
    rerender(<Presentation steps={inserted} title="deck" />)
    expect(q('[data-step-count]')!.getAttribute('data-step-count')).toBe('4')
    expect(marker()).toBe('03') // active index unchanged; the step there is now base[1]
    expect(q('[data-step-id]')!.getAttribute('data-step-id')).toBe('s2')

    rerender(<Presentation steps={[base[2], base[0]]} title="deck" />)
    expect(q('[data-step-count]')!.getAttribute('data-step-count')).toBe('2')
    expect(currentIndex()).toBe(1) // clamped
    expect(marker()).toBe('02')
    expect(qa('[data-presentation-progress-dot]')).toHaveLength(2)
    expect(q('[data-step-id]')!.getAttribute('data-step-id')).toBe('s1')
  })

  it('exposes count and index hooks in both modes through navigation', () => {
    setViewport(1440, 900)
    renderDeck()
    const read = () => [q('[data-step-count]')!.getAttribute('data-step-count'), q('[data-step-index]')!.getAttribute('data-step-index')]
    expect(read()).toEqual(['6', '0'])
    act(() => void press('ArrowRight'))
    expect(read()).toEqual(['6', '1'])
    act(() => void press('p'))
    expect(read()).toEqual(['6', '1'])
    act(() => void press('ArrowRight'))
    expect(read()).toEqual(['6', '2'])
    fireEvent.click(qa('[data-presentation-progress-dot]')[5])
    expect(read()).toEqual(['6', '5'])
    act(() => void press('ArrowLeft'))
    expect(read()).toEqual(['6', '4'])
  })
})

describe('attribution and branding', () => {
  it.each(['browse', 'present'] as const)('shows the default attribution link in %s mode', (mode) => {
    setViewport(1440, 900)
    renderDeck({ initialMode: mode })
    const link = q('[data-presentation-attribution]') as HTMLAnchorElement
    expect(link.tagName).toBe('A')
    expect(link.textContent).toBe('made by and-scene')
    expect(link.getAttribute('href')).toBe('https://github.com/Codagent-AI/and-scene')
    expect(ATTRIBUTION_URL).toBe(link.getAttribute('href'))
    expect(ATTRIBUTION_LABEL).toBe(link.textContent)
  })

  it('anchors the attribution to the bottom-right of the presentation root', () => {
    setViewport(1440, 900)
    renderDeck()
    const link = q('[data-presentation-attribution]')!
    expect(link.style.position).toBe('absolute')
    expect([link.style.right, link.style.bottom]).toEqual(['0px', '0px'])
    expect(link.parentElement).toBe(q('[data-presentation-root]'))
    expect(q('[data-presentation-root]')!.style.position).toBe('fixed') // containing block
  })

  it('accepts an attribution override and can omit it', () => {
    setViewport(1440, 900)
    const { unmount } = renderDeck({ attribution: { href: 'https://example.com', label: 'hi' } })
    expect(q('[data-presentation-attribution]')!.textContent).toBe('hi')
    unmount()
    renderDeck({ attribution: false })
    expect(q('[data-presentation-attribution]')).toBeNull()
  })

  it('has no default and-scene brand in the header; a host brand lands only in its slot', () => {
    setViewport(1440, 900)
    const { unmount } = renderDeck()
    const header = q('[data-presentation-header]')!
    expect(within(header).queryByRole('link')).toBeNull()
    expect(header.textContent).not.toMatch(/and-scene/i)
    expect(q('[data-presentation-brand-slot]')!.childNodes).toHaveLength(0)
    unmount()
    renderDeck({ brand: <a href="/home">My Brand</a> })
    const slot = q('[data-presentation-brand-slot]')!
    expect(within(slot).getByRole('link').textContent).toBe('My Brand')
    expect(qa('[data-presentation-header] a')).toHaveLength(1)
  })
})
