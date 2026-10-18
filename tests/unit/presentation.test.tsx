import { StrictMode, type ReactNode } from 'react'
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ATTRIBUTION_URL, Presentation, type AnyStep } from '../../src/presentation-kit'
import { makeDeck } from '../support/deck'
import { setViewport } from '../support/setup'

const payload = () => [...document.querySelectorAll('[data-testid=scene-payload]')].at(-1)!.textContent
const q = <T extends Element = HTMLElement>(sel: string) => document.querySelector<T>(sel)
const root = () => q('[data-presentation-root]')!
const idx = () => root().dataset.stepIndex
const key = (k: string) => act(() => void window.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true })))
const show = (steps: AnyStep[] = makeDeck(), props: Partial<Parameters<typeof Presentation>[0]> = {}) =>
  render(<Presentation steps={steps} title="Deck" {...props} />)

describe('step model', () => {
  it('renders the active step identity, narration and scene payload', () => {
    show()
    expect(q('[data-presentation-title]')!.textContent).toBe('Title a')
    expect(q('[data-presentation-caption]')!.textContent).toBe('Caption a')
    expect(q('[data-presentation-era]')!.dataset.presentationEra).toBe('one')
    expect(payload()).toBe('payload a')
    key('ArrowRight')
    key('ArrowRight')
    expect(q('[data-presentation-title]')!.textContent).toBe('Title c')
    expect(q('[data-presentation-caption]')!.textContent).toBe('Caption c')
    expect(q('[data-presentation-era]')!.dataset.presentationEra).toBe('two')
    expect(payload()).toBe('payload c')
  })

  it('derives numbers from position after insert, remove and reorder', () => {
    const deck = makeDeck()
    const marker = () => q('[data-presentation-marker-number]')!.textContent
    const { unmount } = show(deck)
    key('ArrowRight')
    expect(marker()).toBe('02')
    unmount()
    const reordered = [deck[3], deck[0], deck[5], deck[1]]
    const view = show(reordered)
    key('ArrowRight')
    key('ArrowRight')
    expect(q('[data-presentation-title]')!.textContent).toBe('Title f')
    expect(marker()).toBe('03')
    view.unmount()
    show([deck[5]])
    expect(marker()).toBe('01')
    const labels = [...document.querySelectorAll('[data-presentation-progress-item]')].map((b) => b.getAttribute('aria-label'))
    expect(labels).toEqual(['Step 01: Title f'])
  })

  it('exposes truthful step-count and step-index hooks', () => {
    const { rerender } = show()
    expect(root().dataset.stepCount).toBe('6')
    expect(idx()).toBe('0')
    key('ArrowRight')
    expect(idx()).toBe('1')
    fireEvent.click(screen.getByLabelText('Step 06: Title f'))
    expect(idx()).toBe('5')
    key('ArrowRight')
    expect(idx()).toBe('5')
    key('p')
    expect(idx()).toBe('5')
    key('ArrowLeft')
    expect(idx()).toBe('4')
    rerender(<Presentation steps={makeDeck().slice(0, 3)} title="Deck" />)
    expect(root().dataset.stepCount).toBe('3')
    expect(document.querySelectorAll('[data-step-count]')).toHaveLength(1)
  })

  it('keeps navigating from the displayed step after the step list shrinks', () => {
    const { rerender } = show()
    fireEvent.click(screen.getByLabelText('Step 06: Title f'))
    rerender(<Presentation steps={makeDeck().slice(0, 3)} title="Deck" />)
    expect(idx()).toBe('2')
    key('ArrowLeft')
    expect(idx()).toBe('1')
    key('ArrowRight')
    key('ArrowRight')
    expect(idx()).toBe('2')
  })
})

describe('modes', () => {
  it('present mode shows marker and title, hides caption, ToC and prev/next', () => {
    show(makeDeck(), { initialMode: 'present' })
    expect(root().dataset.presentationMode).toBe('present')
    expect(q('[data-presentation-marker]')).not.toBeNull()
    expect(q('[data-presentation-title]')!.textContent).toBe('Title a')
    expect(q('[data-presentation-caption]')).toBeNull()
    expect(q('[data-presentation-chrome="toc"]')).toBeNull()
    expect(q('[data-presentation-nav]')).toBeNull()
    expect(q('[data-presentation-progress]')).toBeNull()
    expect(q('[data-presentation-title]')!.style.whiteSpace).toBe('nowrap')
  })

  it('browse mode shows title, caption, prev/next and progress; ToC only on wide viewports', () => {
    for (const [width, toc] of [[1023, false], [1024, true], [1600, true], [390, false]] as const) {
      setViewport(width)
      const { unmount } = show()
      expect(q('[data-presentation-title]')!.textContent).toBe('Title a')
      expect(q('[data-presentation-caption]')!.textContent).toBe('Caption a')
      expect(q('[data-presentation-nav="prev"]')).not.toBeNull()
      expect(q('[data-presentation-nav="next"]')).not.toBeNull()
      expect(document.querySelectorAll('[data-presentation-progress-item]')).toHaveLength(6)
      expect(q('[data-presentation-chrome="toc"]') !== null, `width ${width}`).toBe(toc)
      unmount()
    }
    setViewport(1440)
  })

  it('shows the ToC when the viewport is widened after mount', () => {
    setViewport(800)
    show()
    expect(q('[data-presentation-chrome="toc"]')).toBeNull()
    act(() => {
      setViewport(1300)
      window.dispatchEvent(new Event('resize'))
    })
    expect(q('[data-presentation-chrome="toc"]')).not.toBeNull()
    setViewport(1440)
  })

  it('honours initialMode and toggles via key and visible control without losing position', () => {
    show(makeDeck(), { initialMode: 'browse' })
    key('ArrowRight')
    key('ArrowRight')
    key('p')
    expect(root().dataset.presentationMode).toBe('present')
    expect(idx()).toBe('2')
    expect(payload()).toBe('payload c')
    fireEvent.click(q('[data-presentation-mode-toggle]')!)
    expect(root().dataset.presentationMode).toBe('browse')
    expect(idx()).toBe('2')
    expect(q('[data-presentation-caption]')!.textContent).toBe('Caption c')
  })
})

describe('navigation chrome', () => {
  it('jumps via progress items and via ToC entries to the first step of the era', () => {
    show()
    fireEvent.click(screen.getByLabelText('Step 05: Title e'))
    expect(idx()).toBe('4')
    expect(q('[data-presentation-title]')!.textContent).toBe('Title e')
    expect(payload()).toBe('payload e')
    const toc = within(q('[data-presentation-chrome="toc"]')!)
    fireEvent.click(toc.getByText('two'))
    expect(idx()).toBe('2')
    fireEvent.click(toc.getByText('three'))
    expect(idx()).toBe('4')
    fireEvent.click(toc.getByText('one'))
    expect(idx()).toBe('0')
  })

  it('uses the first step of an era label that repeats later', () => {
    const deck = makeDeck()
    const repeated = [...deck.slice(0, 2), deck[3], { ...deck[2], id: 'again', era: 'one' }]
    show(repeated)
    fireEvent.click(screen.getByLabelText('Step 04: Title c'))
    fireEvent.click(within(q('[data-presentation-chrome="toc"]')!).getByText('one'))
    expect(idx()).toBe('0')
    expect(document.querySelectorAll('[data-presentation-toc-item]')).toHaveLength(2)
  })

  it('marks only the current progress item and era as active, updating on every move', () => {
    show()
    const active = (sel: string) => [...document.querySelectorAll(sel)].flatMap((el, i) => (el.hasAttribute('data-presentation-active') ? [i] : []))
    const current = (sel: string) => [...document.querySelectorAll(sel)].flatMap((el, i) => (el.getAttribute('aria-current') === 'step' ? [i] : []))
    expect(active('[data-presentation-progress-item]')).toEqual([0])
    expect(current('[data-presentation-progress-item]')).toEqual([0])
    expect(active('[data-presentation-toc-item]')).toEqual([0])
    key('ArrowRight')
    key('ArrowRight')
    expect(active('[data-presentation-progress-item]')).toEqual([2])
    expect(current('[data-presentation-progress-item]')).toEqual([2])
    expect(current('[data-presentation-toc-item]')).toEqual([1])
    fireEvent.click(screen.getByLabelText('Step 05: Title e'))
    expect(active('[data-presentation-progress-item]')).toEqual([4])
    expect(active('[data-presentation-toc-item]')).toEqual([2])
    expect(document.querySelectorAll('[aria-current]')).toHaveLength(2)
  })

  it('walks every step with the next/prev buttons and clamps at the ends', () => {
    show()
    const next = screen.getByLabelText('Next step') as HTMLButtonElement
    const prev = screen.getByLabelText('Previous step') as HTMLButtonElement
    expect(prev.disabled).toBe(true)
    for (let i = 0; i < 5; i++) {
      fireEvent.click(next)
      expect(q('[data-presentation-caption]')!.textContent).toBe(`Caption ${'abcdef'[i + 1]}`)
    }
    expect(next.disabled).toBe(true)
    fireEvent.click(next)
    expect(idx()).toBe('5')
    fireEvent.click(prev)
    expect(q('[data-presentation-caption]')!.textContent).toBe('Caption e')
  })
})

describe('branding and attribution', () => {
  it('shows the default bottom-right attribution link with a styling hook', () => {
    show()
    const a = q<HTMLAnchorElement>('[data-presentation-attribution]')!
    expect(a.textContent).toBe('made by and-scene')
    expect(a.href).toBe(ATTRIBUTION_URL)
    const url = new URL(a.href)
    expect(url.protocol).toBe('https:')
    expect(url.hostname).toBe('github.com')
    expect(url.pathname.endsWith('/and-scene')).toBe(true)
    const slot = q('[data-presentation-attribution-slot]')!
    expect(slot.style.position).toBe('fixed')
    expect(slot.style.right).toBe('0px')
    expect(slot.style.bottom).toBe('0px')
    expect(slot.contains(a)).toBe(true)
    expect(q('[data-presentation-brand-slot]')!.contains(a)).toBe(false)
  })

  it('attribution can be overridden or omitted', () => {
    const { unmount } = show(makeDeck(), { attribution: { label: 'by me', href: 'https://example.com/x' } })
    const a = q<HTMLAnchorElement>('[data-presentation-attribution]')!
    expect([a.textContent, a.href]).toEqual(['by me', 'https://example.com/x'])
    unmount()
    show(makeDeck(), { attribution: false })
    expect(q('[data-presentation-attribution]')).toBeNull()
  })

  it('has no default top-left brand; a host brand lands exactly in that slot', () => {
    const { unmount } = show()
    expect(q('[data-presentation-brand-slot]')!.childNodes).toHaveLength(0)
    expect(q('[data-presentation-chrome="header"] a')).toBeNull()
    unmount()
    const brand: ReactNode = <a href="/home">Host</a>
    show(makeDeck(), { brand })
    expect(q('[data-presentation-brand-slot] a')!.textContent).toBe('Host')
    expect(q('[data-presentation-attribution]')).not.toBeNull()
  })
})

describe('StrictMode', () => {
  it('keeps one transition per key and one live listener', () => {
    render(
      <StrictMode>
        <Presentation steps={makeDeck()} title="Deck" />
      </StrictMode>,
    )
    key('ArrowRight')
    expect(idx()).toBe('1')
    key('p')
    expect(root().dataset.presentationMode).toBe('present')
  })
})
