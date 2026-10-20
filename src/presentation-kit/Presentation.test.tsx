import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { useEffect } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { ATTRIBUTION_LABEL, ATTRIBUTION_URL } from './constants.ts'
import { Presentation } from './Presentation.tsx'
import { makeSteps } from './__fixtures__/testSteps.ts'

function setWidth(width: number, height = 900) {
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: width })
  Object.defineProperty(window, 'innerHeight', { configurable: true, value: height })
  act(() => {
    window.dispatchEvent(new Event('resize'))
  })
}

const root = () => document.querySelector('[data-presentation-chrome]')!
const idx = () => Number(root().getAttribute('data-step-index'))
const press = (k: string) =>
  act(() => {
    fireEvent.keyDown(document.body, { key: k })
  })

describe('step numbering and identity', () => {
  it('derives marker numbers and eras from position, not ids', () => {
    const { rerender } = render(<Presentation steps={makeSteps()} title="Deck" />)
    expect(screen.getByText(/^01 · a$/)).toBeTruthy()
    press('ArrowRight')
    press('ArrowRight')
    expect(document.querySelector('[data-presentation-marker]')!.textContent).toBe('03 · b')

    // Insert one step at the front: the same step slides to position 4 with no renumbering.
    rerender(<Presentation steps={makeSteps(['z', 'a', 'a', 'b', 'b', 'b', 'c'])} title="Deck" />)
    expect(document.querySelector('[data-presentation-marker]')!.textContent).toBe('03 · a')
    expect(root().getAttribute('data-step-count')).toBe('7')

    // Remove steps: the last position is simply renumbered.
    rerender(<Presentation steps={makeSteps(['a', 'b'])} title="Deck" />)
    act(() => {
      fireEvent.click(screen.getByLabelText(/^Step 2:/))
    })
    expect(document.querySelector('[data-presentation-marker]')!.textContent).toBe('02 · b')
  })
})

describe('reordering', () => {
  it('renumbers existing stable-id steps by their new position', () => {
    const [a, b, c] = makeSteps(['x', 'y', 'z'])
    const marker = () => document.querySelector('[data-presentation-marker]')!.textContent
    const { rerender } = render(<Presentation steps={[a, b, c]} title="Deck" />)
    expect(marker()).toBe('01 · x')
    expect(document.querySelector('[data-presentation-title]')!.textContent).toBe(a.title)
    // Same steps, same ids, new order: the first slot now holds b and is numbered 01.
    rerender(<Presentation steps={[b, c, a]} title="Deck" />)
    expect(marker()).toBe('01 · y')
    expect(document.querySelector('[data-presentation-title]')!.textContent).toBe(b.title)
    act(() => {
      fireEvent.keyDown(document.body, { key: 'ArrowRight' })
    })
    expect(marker()).toBe('02 · z')
    act(() => {
      fireEvent.keyDown(document.body, { key: 'ArrowRight' })
    })
    expect(marker()).toBe('03 · x')
    expect(document.querySelector('[data-presentation-title]')!.textContent).toBe(a.title)
    expect(a.id).not.toBe('03')
  })
})

describe('chrome hooks', () => {
  it.each(['browse', 'present'] as const)('exposes step count and index in %s mode', (mode) => {
    render(<Presentation steps={makeSteps()} title="Deck" initialMode={mode} />)
    expect(root().getAttribute('data-step-count')).toBe('6')
    expect(idx()).toBe(0)
    press('ArrowRight')
    expect(idx()).toBe(1)
    press('p')
    expect(root().getAttribute('data-step-count')).toBe('6')
    expect(idx()).toBe(1)
  })
})

describe('present mode', () => {
  it('shows the marker and one-line title and hides reading chrome', () => {
    setWidth(1440)
    render(<Presentation steps={makeSteps()} title="Deck" initialMode="present" />)
    expect(document.querySelector('[data-presentation-marker]')!.textContent).toBe('01 · a')
    const title = document.querySelector<HTMLElement>('[data-presentation-title]')!
    expect(title.textContent).toBe('Title 0')
    expect(title.style.whiteSpace).toBe('nowrap')
    expect(document.querySelector('[data-presentation-caption]')).toBeNull()
    expect(document.querySelector('[data-presentation-toc]')).toBeNull()
    expect(document.querySelector('[data-presentation-prev]')).toBeNull()
    expect(document.querySelector('[data-presentation-next]')).toBeNull()
    expect(document.querySelector('[data-presentation-progress]')).toBeNull()
  })
})

describe('browse mode', () => {
  it('shows title, full caption, progress, controls, and a wide-viewport ToC', () => {
    setWidth(1440)
    render(<Presentation steps={makeSteps()} title="Deck" initialMode="browse" />)
    expect(document.querySelector('[data-presentation-title]')!.textContent).toBe('Title 0')
    expect(document.querySelector('[data-presentation-caption]')!.textContent).toBe('Caption 0')
    expect(document.querySelectorAll('[data-presentation-progress-item]')).toHaveLength(6)
    expect(document.querySelector('[data-presentation-prev]')).not.toBeNull()
    expect(document.querySelector('[data-presentation-next]')).not.toBeNull()
    expect(document.querySelectorAll('[data-presentation-toc-item]')).toHaveLength(3)
    expect(document.querySelector('[data-presentation-deck-title]')!.textContent).toBe('Deck')
  })

  it('drops the ToC on narrow viewports but keeps progress and controls', () => {
    setWidth(390)
    render(<Presentation steps={makeSteps()} title="Deck" />)
    expect(document.querySelector('[data-presentation-toc]')).toBeNull()
    expect(document.querySelectorAll('[data-presentation-progress-item]')).toHaveLength(6)
    expect(document.querySelector('[data-presentation-next]')).not.toBeNull()
    setWidth(1440)
    expect(document.querySelector('[data-presentation-toc]')).not.toBeNull()
  })

  it('toggles between modes through the control and keeps the step', () => {
    render(<Presentation steps={makeSteps()} title="Deck" />)
    press('ArrowRight')
    press('ArrowRight')
    const toggle = () => document.querySelector<HTMLElement>('[data-presentation-mode-toggle]')!
    act(() => toggle().click())
    expect(root().getAttribute('data-presentation-mode')).toBe('present')
    expect(idx()).toBe(2)
    act(() => toggle().click())
    expect(root().getAttribute('data-presentation-mode')).toBe('browse')
    expect(idx()).toBe(2)
  })
})

describe('navigation controls', () => {
  it('moves with next and previous and shows each step\'s caption', () => {
    render(<Presentation steps={makeSteps()} title="Deck" />)
    const next = document.querySelector<HTMLElement>('[data-presentation-next]')!
    const prev = document.querySelector<HTMLElement>('[data-presentation-prev]')!
    act(() => next.click())
    expect(document.querySelector('[data-presentation-caption]')!.textContent).toBe('Caption 1')
    act(() => next.click())
    act(() => prev.click())
    expect(idx()).toBe(1)
    expect(document.querySelector('[data-presentation-caption]')!.textContent).toBe('Caption 1')
  })

  it('disables previous at the start and next at the end', () => {
    render(<Presentation steps={makeSteps(['a', 'b'])} title="Deck" />)
    const next = document.querySelector<HTMLButtonElement>('[data-presentation-next]')!
    const prev = document.querySelector<HTMLButtonElement>('[data-presentation-prev]')!
    expect(prev.disabled).toBe(true)
    act(() => next.click())
    act(() => next.click())
    expect(idx()).toBe(1)
    expect(next.disabled).toBe(true)
    expect(prev.disabled).toBe(false)
  })

  it('jumps via progress items and to the first step of an era via ToC entries', () => {
    setWidth(1440)
    render(<Presentation steps={makeSteps()} title="Deck" />)
    act(() => {
      document.querySelectorAll<HTMLElement>('[data-presentation-progress-item]')[4].click()
    })
    expect(idx()).toBe(4)
    const toc = within(document.querySelector<HTMLElement>('[data-presentation-toc]')!)
    act(() => toc.getByText('b').click())
    expect(idx()).toBe(2)
    act(() => toc.getByText('c').click())
    expect(idx()).toBe(5)
    act(() => toc.getByText('a').click())
    expect(idx()).toBe(0)
  })

  it('exposes current state only on the active progress and ToC entries', () => {
    setWidth(1440)
    render(<Presentation steps={makeSteps()} title="Deck" />)
    const progress = () => [...document.querySelectorAll('[data-presentation-progress-item]')]
    const toc = () => [...document.querySelectorAll('[data-presentation-toc-item]')]
    const activeOf = (items: Element[]) =>
      items.map((el, i) => (el.getAttribute('data-presentation-active') === 'true' ? i : -1)).filter((i) => i >= 0)
    expect(activeOf(progress())).toEqual([0])
    expect(progress()[0].getAttribute('aria-current')).toBe('step')
    expect(progress().filter((el) => el.hasAttribute('aria-current'))).toHaveLength(1)
    expect(toc()[0].getAttribute('aria-current')).toBe('true')
    press('ArrowRight')
    press('ArrowRight')
    expect(activeOf(progress())).toEqual([2])
    expect(progress().filter((el) => el.hasAttribute('aria-current'))).toHaveLength(1)
    expect(activeOf(toc())).toEqual([1])
    expect(toc().filter((el) => el.hasAttribute('aria-current'))).toHaveLength(1)
    act(() => (progress()[5] as HTMLElement).click())
    expect(activeOf(progress())).toEqual([5])
    expect(activeOf(toc())).toEqual([2])
  })

  it('does not double-handle keys on a focused control', () => {
    render(<Presentation steps={makeSteps()} title="Deck" />)
    const next = document.querySelector<HTMLElement>('[data-presentation-next]')!
    next.focus()
    act(() => {
      fireEvent.keyDown(next, { key: 'ArrowRight' })
      fireEvent.keyDown(next, { key: ' ' })
      fireEvent.keyDown(next, { key: 'p' })
    })
    expect(idx()).toBe(0)
    expect(root().getAttribute('data-presentation-mode')).toBe('browse')
    act(() => next.click())
    expect(idx()).toBe(1)
  })
})

describe('attribution and branding', () => {
  it.each(['browse', 'present'] as const)('links "made by and-scene" bottom-right in %s mode', (mode) => {
    render(<Presentation steps={makeSteps()} title="Deck" initialMode={mode} />)
    const link = document.querySelector<HTMLAnchorElement>('[data-presentation-attribution]')!
    expect(link.textContent).toBe(ATTRIBUTION_LABEL)
    expect(ATTRIBUTION_LABEL).toBe('made by and-scene')
    expect(link.getAttribute('href')).toBe('https://github.com/Codagent-AI/and-scene')
    expect(ATTRIBUTION_URL).toBe(link.getAttribute('href'))
    // Positioned against the fixed full-viewport root's bottom-right corner.
    expect((link as HTMLElement).style.position).toBe('absolute')
    expect(link.style.right).toBe('0px')
    expect(link.style.bottom).toBe('0px')
    expect((root() as HTMLElement).style.position).toBe('fixed')
    expect(link.parentElement).toBe(root())
  })

  it('lets the host override or omit the attribution', () => {
    const { unmount } = render(
      <Presentation steps={makeSteps()} title="Deck" attribution={{ href: 'https://example.com', label: 'x' }} />,
    )
    expect(document.querySelector('[data-presentation-attribution]')!.getAttribute('href')).toBe('https://example.com')
    unmount()
    render(<Presentation steps={makeSteps()} title="Deck" attribution={false} />)
    expect(document.querySelector('[data-presentation-attribution]')).toBeNull()
  })

  it('has no default and-scene brand in the top-left slot, and renders host branding when given', () => {
    const { unmount } = render(<Presentation steps={makeSteps()} title="Deck" />)
    const slot = () => document.querySelector('[data-presentation-brand-slot]')!
    expect(slot().children).toHaveLength(0)
    expect(slot().textContent).toBe('')
    expect(document.querySelectorAll('a')).toHaveLength(1)
    unmount()
    render(<Presentation steps={makeSteps()} title="Deck" brand={<b>Acme</b>} />)
    expect(slot().textContent).toBe('Acme')
  })
})

describe('StrictMode and effects', () => {
  it('keeps a single scene instance across grouped navigation', () => {
    const onMount = vi.fn()
    function Probe() {
      useEffect(() => {
        onMount()
      }, [])
      return null
    }
    const steps = makeSteps().map((s) => ({
      ...s,
      Scene: ({ payload }: { payload: { n: number } }) => (
        <>
          <Probe />
          {payload.n}
        </>
      ),
    }))
    // Distinct arrow per step would split the group; share one Scene instead.
    const Shared = steps[0].Scene
    render(<Presentation steps={steps.map((s) => ({ ...s, Scene: Shared }))} title="Deck" />)
    const baseline = onMount.mock.calls.length
    press('ArrowRight')
    press('ArrowRight')
    expect(onMount.mock.calls.length).toBe(baseline)
  })
})
