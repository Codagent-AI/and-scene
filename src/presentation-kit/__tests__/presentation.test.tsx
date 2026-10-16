import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, expectTypeOf, it } from 'vitest'
import { Presentation } from '../Presentation'
import type { Step } from '../types'
import { Counter, deck, groupedSteps, Plain } from './fixtures'

const root = () => document.querySelector<HTMLElement>('[data-presentation-root]')!
const idx = () => Number(root().dataset.stepIndex)
const key = (k: string, target: Window | Element = window) => fireEvent.keyDown(target, { key: k })

describe('step model', () => {
  it('derives numbering from position', () => {
    const { rerender } = render(<Presentation steps={deck} />)
    const num = () => document.querySelector('[data-presentation-step-number]')!.textContent
    expect(num()).toBe('1')
    rerender(<Presentation steps={[deck[2], deck[0], deck[1]]} />)
    expect(num()).toBe('1')
    expect(root().dataset.stepCount).toBe('3')
    key('ArrowRight')
    expect(num()).toBe('2')
  })

  it('accepts typed grouped payloads without casts', () => {
    const el = <Presentation steps={groupedSteps} />
    expect(el).toBeTruthy()
    expectTypeOf(groupedSteps).toEqualTypeOf<Step<{ label: string }>[]>()
    // @ts-expect-error payload type mismatch must be rejected
    const bad: Step<{ label: string }> = { id: 'x', era: 'e', title: 't', caption: 'c', Scene: Counter, payload: { nope: 1 } }
    expect(bad).toBeTruthy()
  })
})

describe('grouped scenes', () => {
  it('keeps one instance across grouped steps and updates payload', async () => {
    render(<Presentation steps={groupedSteps} />)
    const before = screen.getByTestId('counter')
    const instance = before.dataset.instance
    key('ArrowRight')
    await waitFor(() => expect(screen.getByTestId('counter').textContent).toBe('b'))
    expect(screen.getAllByTestId('counter')).toHaveLength(1)
    expect(screen.getByTestId('counter').dataset.instance).toBe(instance)
    expect(screen.getByTestId('counter')).toBe(before)
  })

  it('remounts when steps are not grouped', async () => {
    const steps: Step[] = [
      { id: 'x', era: 'E', title: 'X', caption: 'cx', Scene: Plain },
      { id: 'y', era: 'E', title: 'Y', caption: 'cy', Scene: Plain },
    ]
    render(<Presentation steps={steps} />)
    const before = screen.getByTestId('plain')
    key('ArrowRight')
    await waitFor(() => expect(screen.getByTestId('plain').textContent).toBe('Y'))
    expect(screen.getByTestId('plain')).not.toBe(before)
  })
})

describe('modes and chrome', () => {
  it('present mode shows marker and title only', () => {
    render(<Presentation steps={deck} initialMode="present" />)
    expect(root().dataset.presentationMode).toBe('present')
    expect(document.querySelector('[data-presentation-era]')!.textContent).toBe('Alpha')
    expect(document.querySelector('footer [data-presentation-title]')!.textContent).toBe('T1')
    expect(document.querySelector('[data-presentation-caption]')).toBeNull()
    expect(document.querySelector('[data-presentation-toc]')).toBeNull()
    expect(document.querySelector('[data-presentation-prev]')).toBeNull()
    expect(document.querySelector('[data-presentation-next]')).toBeNull()
  })

  it('browse mode shows caption, toc, controls and progress', () => {
    render(<Presentation steps={deck} initialMode="browse" />)
    expect(root().dataset.presentationMode).toBe('browse')
    expect(document.querySelector('header [data-presentation-title]')!.textContent).toBe('T1')
    expect(document.querySelector('[data-presentation-caption]')!.textContent).toBe('C1')
    expect(document.querySelector('[data-presentation-toc]')).not.toBeNull()
    expect(document.querySelector('[data-presentation-prev]')).not.toBeNull()
    expect(document.querySelector('[data-presentation-next]')).not.toBeNull()
    expect(document.querySelectorAll('[data-presentation-progress-item]')).toHaveLength(5)
  })

  it('hides the toc on narrow viewports', () => {
    render(<Presentation steps={deck} initialMode="browse" tocMinWidth={5000} />)
    expect(document.querySelector('[data-presentation-toc]')).toBeNull()
  })

  it('toggling mode with P preserves position', () => {
    render(<Presentation steps={deck} initialMode="present" />)
    key('ArrowRight')
    key('ArrowRight')
    key('p')
    expect(root().dataset.presentationMode).toBe('browse')
    expect(idx()).toBe(2)
    key('P')
    expect(root().dataset.presentationMode).toBe('present')
    expect(idx()).toBe(2)
  })
})

describe('navigation', () => {
  it('handles keyboard keys', () => {
    render(<Presentation steps={deck} />)
    key('ArrowRight')
    expect(idx()).toBe(1)
    key(' ')
    expect(idx()).toBe(2)
    key('PageDown')
    expect(idx()).toBe(3)
    key('ArrowLeft')
    expect(idx()).toBe(2)
    key('PageUp')
    expect(idx()).toBe(1)
  })

  it('clamps at both ends', () => {
    render(<Presentation steps={deck} />)
    key('ArrowLeft')
    expect(idx()).toBe(0)
    for (let i = 0; i < 10; i++) key('ArrowRight')
    expect(idx()).toBe(4)
  })

  it('swipes: left advances, right goes back, vertical ignored', () => {
    render(<Presentation steps={deck} />)
    const swipe = (dx: number, dy = 0) => {
      fireEvent.touchStart(window, { changedTouches: [{ clientX: 200, clientY: 100 }] })
      fireEvent.touchEnd(window, { changedTouches: [{ clientX: 200 + dx, clientY: 100 + dy }] })
    }
    swipe(-120)
    expect(idx()).toBe(1)
    swipe(120)
    expect(idx()).toBe(0)
    swipe(-10)
    swipe(-100, 200)
    expect(idx()).toBe(0)
  })

  it('jumps via progress indicators and toc (first step of era)', async () => {
    const user = userEvent.setup()
    render(<Presentation steps={deck} initialMode="browse" />)
    await user.click(screen.getByRole('button', { name: /go to step 4/i }))
    expect(idx()).toBe(3)
    const toc = within(document.querySelector<HTMLElement>('[data-presentation-toc]')!)
    await user.click(toc.getByRole('button', { name: 'Beta' }))
    expect(idx()).toBe(2)
    await user.click(toc.getByRole('button', { name: 'Gamma' }))
    expect(idx()).toBe(4)
  })

  it('prev/next buttons navigate', async () => {
    const user = userEvent.setup()
    render(<Presentation steps={deck} initialMode="browse" />)
    await user.click(screen.getByRole('button', { name: /next step/i }))
    expect(idx()).toBe(1)
    await user.click(screen.getByRole('button', { name: /previous step/i }))
    expect(idx()).toBe(0)
  })

  it('does not hijack keys from focused interactive controls', () => {
    render(<Presentation steps={deck} initialMode="browse" />)
    const btn = screen.getByRole('button', { name: /go to step 3/i })
    btn.focus()
    act(() => {
      key(' ', btn)
      key('ArrowRight', btn)
      key('p', btn)
    })
    expect(idx()).toBe(0)
    expect(root().dataset.presentationMode).toBe('browse')
  })

  it('exposes active state on progress and toc items', async () => {
    const user = userEvent.setup()
    render(<Presentation steps={deck} initialMode="browse" />)
    await user.click(screen.getByRole('button', { name: /go to step 4/i }))
    const prog = [...document.querySelectorAll('[data-presentation-progress-item]')]
    const active = prog.filter((e) => e.getAttribute('aria-current') === 'step')
    expect(active).toHaveLength(1)
    expect(active[0]).toBe(prog[3])
    expect(active[0].getAttribute('data-presentation-active')).toBe('true')
    expect(prog.filter((e) => e.hasAttribute('data-presentation-active'))).toHaveLength(1)
    const toc = [...document.querySelectorAll('[data-presentation-toc-item]')]
    const tocActive = toc.filter((e) => e.getAttribute('aria-current') === 'step')
    expect(tocActive.map((e) => e.textContent)).toEqual(['Beta'])
    expect(tocActive[0].getAttribute('data-presentation-active')).toBe('true')
  })
})

describe('attribution and branding', () => {
  it('shows default attribution with a hook', () => {
    render(<Presentation steps={deck} />)
    const a = document.querySelector<HTMLAnchorElement>('[data-presentation-attribution]')!
    expect(a.textContent).toBe('made by and-scene')
    expect(a.href).toBe('https://github.com/Codagent-AI/and-scene')
  })

  it('has no default top-left brand, but supports a host slot', () => {
    const { unmount } = render(<Presentation steps={deck} />)
    expect(document.querySelector('header a')).toBeNull()
    expect(document.querySelector('header')!.textContent).not.toMatch(/and-scene/i)
    unmount()
    render(<Presentation steps={deck} brand={<a href="/">Host</a>} />)
    expect(document.querySelector('header [data-presentation-brand-slot] a')!.textContent).toBe('Host')
  })

  it('can disable attribution', () => {
    render(<Presentation steps={deck} attribution={false} />)
    expect(document.querySelector('[data-presentation-attribution]')).toBeNull()
  })
})
