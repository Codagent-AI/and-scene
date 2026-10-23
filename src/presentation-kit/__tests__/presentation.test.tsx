// @vitest-environment jsdom
import { act, fireEvent, render, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { MotionGlobalConfig } from 'motion/react'
import { Presentation, type PresentationProps } from '../Presentation'
import { ATTRIBUTION_URL } from '../constants'
import { stepNumber } from '../chrome/stepNumber'
import { makeSteps, setViewportWidth, type Payload } from './fixtureData'

const deck = (props: Partial<PresentationProps<Payload>> = {}) => (
  <Presentation steps={makeSteps()} title="Deck" {...props} />
)
const root = (view: ReturnType<typeof render>) => view.container.querySelector('[data-presentation-root]') as HTMLElement
const next = (view: ReturnType<typeof render>) => view.container.querySelector('[data-presentation-control="next"]') as HTMLButtonElement
const prev = (view: ReturnType<typeof render>) => view.container.querySelector('[data-presentation-control="prev"]') as HTMLButtonElement
const dots = (view: ReturnType<typeof render>) => Array.from(view.container.querySelectorAll<HTMLElement>('[data-presentation-progress]'))
const tocEntries = (view: ReturnType<typeof render>) => Array.from(view.container.querySelectorAll<HTMLElement>('[data-presentation-toc-entry]'))
/** Waits until the outgoing scene has finished its exit and only the active scene remains. */
const waitForSceneText = (view: ReturnType<typeof render>, text: string) =>
  waitFor(() => {
    const roots = view.container.querySelectorAll('[data-testid="scene-root"]')
    expect(roots).toHaveLength(1)
    expect(roots[0]!.textContent).toBe(text)
  })
const press = (key: string) => act(() => {
  window.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }))
})

beforeEach(() => {
  // Motion does not advance its clock in jsdom, so exits are completed immediately here.
  MotionGlobalConfig.skipAnimations = true
})

afterEach(() => setViewportWidth(1024))

describe('step rendering', () => {
  it('shows the active step title, caption, and scene content', async () => {
    const view = render(deck())
    expect(view.getByText('First title', { selector: '[data-presentation-title]' })).toBeTruthy()
    expect(view.getByText('First caption', { selector: '[data-presentation-caption]' })).toBeTruthy()
    expect(view.getByTestId('scene-root').textContent).toBe('A')
    press('ArrowRight')
    expect(view.getByText('Second title', { selector: '[data-presentation-title]' })).toBeTruthy()
    expect(view.getByText('Second caption', { selector: '[data-presentation-caption]' })).toBeTruthy()
    await waitForSceneText(view, 'B')
  })

  it('derives the displayed number from array position after insertion, removal, and reorder', () => {
    const steps = makeSteps()
    const view = render(<Presentation steps={steps} title="Deck" />)
    const marker = () => view.container.querySelector('[data-presentation-marker]')!.textContent
    expect(marker()).toBe('01')
    const reordered = [steps[2]!, steps[0]!, steps[1]!, steps[3]!]
    view.rerender(<Presentation steps={reordered} title="Deck" />)
    expect(marker()).toBe('01')
    press('ArrowRight')
    expect(marker()).toBe('02')
    expect(view.container.querySelector('[data-presentation-title]')!.textContent).toBe('First title')
  })

  it('exposes a numbering helper that is pure of stored numbers', () => {
    expect([stepNumber(0), stepNumber(8), stepNumber(11)]).toEqual(['01', '09', '12'])
  })
})

describe('present and browse chrome', () => {
  it('shows only the marker and one-line title in present mode', () => {
    const view = render(deck({ initialMode: 'present' }))
    expect(root(view).getAttribute('data-presentation-mode')).toBe('present')
    expect(view.container.querySelector('[data-presentation-caption]')).toBeNull()
    expect(view.container.querySelector('[data-presentation-toc]')).toBeNull()
    expect(view.container.querySelector('[data-presentation-controls]')).toBeNull()
    const title = view.container.querySelector<HTMLElement>('[data-presentation-title]')!
    expect(title.style.whiteSpace).toBe('nowrap')
    expect(title.style.textOverflow).toBe('ellipsis')
    expect(view.container.querySelector('[data-presentation-marker]')).not.toBeNull()
  })

  it('shows title, caption, controls, and progress in browse mode', () => {
    const view = render(deck())
    expect(root(view).getAttribute('data-presentation-mode')).toBe('browse')
    expect(view.container.querySelector('[data-presentation-caption]')).not.toBeNull()
    expect(next(view)).not.toBeNull()
    expect(prev(view)).not.toBeNull()
    expect(dots(view)).toHaveLength(4)
  })

  it('shows the table of contents only at 1024 CSS px and above', () => {
    setViewportWidth(1023)
    const narrow = render(deck())
    expect(narrow.container.querySelector('[data-presentation-toc]')).toBeNull()
    narrow.unmount()
    setViewportWidth(1024)
    const wide = render(deck())
    expect(wide.container.querySelector('[data-presentation-toc]')).not.toBeNull()
  })

  it('hides the table of contents in present mode even on wide viewports', () => {
    setViewportWidth(1440)
    const view = render(deck({ initialMode: 'present' }))
    expect(view.container.querySelector('[data-presentation-toc]')).toBeNull()
  })

  it('updates the table of contents when the viewport crosses the breakpoint', () => {
    setViewportWidth(800)
    const view = render(deck())
    expect(view.container.querySelector('[data-presentation-toc]')).toBeNull()
    setViewportWidth(1200)
    act(() => {
      window.dispatchEvent(new Event('resize'))
    })
    expect(view.container.querySelector('[data-presentation-toc]')).not.toBeNull()
  })

  it('renders the attribution with its text, URL, and hook in both modes', () => {
    const view = render(deck())
    const link = view.container.querySelector<HTMLAnchorElement>('[data-presentation-attribution]')!
    expect(link.textContent).toBe('made by and-scene')
    expect(link.getAttribute('href')).toBe(ATTRIBUTION_URL)
    expect(link.style.right).toBe('0px')
    expect(link.style.bottom).toBe('0px')
    view.unmount()
    const presentView = render(deck({ initialMode: 'present' }))
    expect(presentView.container.querySelector('[data-presentation-attribution]')).not.toBeNull()
  })

  it('renders no and-scene brand unless the host supplies one', () => {
    const plain = render(deck())
    const header = plain.container.querySelector('[data-presentation-header]')!
    expect(within(header as HTMLElement).queryByRole('link')).toBeNull()
    plain.unmount()
    const branded = render(deck({ brand: <a href="/host">Host brand</a> }))
    const slot = branded.container.querySelector('[data-presentation-brand]')!
    expect(within(slot as HTMLElement).getByRole('link', { name: 'Host brand' })).toBeTruthy()
  })
})

describe('mode, position, and hooks', () => {
  it('starts in the initial mode and toggles without changing the step', () => {
    const view = render(deck({ initialMode: 'browse' }))
    press('ArrowRight')
    press('ArrowRight')
    press('p')
    expect(root(view).getAttribute('data-presentation-mode')).toBe('present')
    expect(root(view).getAttribute('data-step-index')).toBe('2')
    press('P')
    expect(root(view).getAttribute('data-presentation-mode')).toBe('browse')
    expect(root(view).getAttribute('data-step-index')).toBe('2')
  })

  it('exposes step count and index on the chrome root in both modes and after each navigation', () => {
    const view = render(deck())
    expect(root(view).getAttribute('data-step-count')).toBe('4')
    expect(root(view).getAttribute('data-step-index')).toBe('0')
    fireEvent.click(next(view))
    expect(root(view).getAttribute('data-step-index')).toBe('1')
    fireEvent.click(prev(view))
    expect(root(view).getAttribute('data-step-index')).toBe('0')
    fireEvent.click(dots(view)[3]!)
    expect(root(view).getAttribute('data-step-index')).toBe('3')
    press('p')
    expect(root(view).getAttribute('data-step-count')).toBe('4')
    expect(root(view).getAttribute('data-step-index')).toBe('3')
  })

  it('keeps the same scene element when toggling mode', () => {
    const view = render(deck())
    const scene = view.container.querySelector('[data-presentation-scene]')
    press('p')
    expect(view.container.querySelector('[data-presentation-scene]')).toBe(scene)
  })

  it('keeps the canvas at the default 880 by 380 design size with one scale transform', () => {
    const view = render(deck())
    const inner = view.container.querySelector<HTMLElement>('[data-presentation-canvas-inner]')!
    expect(inner.style.width).toBe('880px')
    expect(inner.style.height).toBe('380px')
    expect(inner.style.transform).toMatch(/^scale\(/)
  })
})

describe('navigation controls', () => {
  it('jumps directly from a progress indicator', async () => {
    const view = render(deck())
    fireEvent.click(dots(view)[2]!)
    expect(root(view).getAttribute('data-step-index')).toBe('2')
    await waitForSceneText(view, 'C')
  })

  it('jumps a table-of-contents entry to the first step of its era', () => {
    setViewportWidth(1440)
    const view = render(deck())
    press('ArrowRight')
    press('ArrowRight')
    press('ArrowRight')
    expect(root(view).getAttribute('data-step-index')).toBe('3')
    fireEvent.click(tocEntries(view)[0]!)
    expect(root(view).getAttribute('data-step-index')).toBe('0')
    fireEvent.click(tocEntries(view)[1]!)
    expect(root(view).getAttribute('data-step-index')).toBe('2')
  })

  it('marks the active progress dot and era entry with semantic current state and hooks', () => {
    setViewportWidth(1440)
    const view = render(deck())
    press('ArrowRight')
    press('ArrowRight')
    const activeDots = dots(view).filter((dot) => dot.getAttribute('aria-current') === 'step')
    expect(activeDots).toHaveLength(1)
    expect(dots(view)[2]!.getAttribute('data-presentation-active')).toBe('true')
    expect(dots(view)[0]!.hasAttribute('aria-current')).toBe(false)
    expect(dots(view)[0]!.hasAttribute('data-presentation-active')).toBe(false)
    const activeEntries = tocEntries(view).filter((entry) => entry.getAttribute('aria-current') === 'step')
    expect(activeEntries).toHaveLength(1)
    expect(activeEntries[0]!.getAttribute('data-era')).toBe('two')
    expect(activeEntries[0]!.getAttribute('data-presentation-active')).toBe('true')
    expect(tocEntries(view)[0]!.hasAttribute('data-presentation-active')).toBe(false)
  })

  it('disables previous at the first step and next at the last step', () => {
    const view = render(deck())
    expect(prev(view).disabled).toBe(true)
    fireEvent.click(dots(view)[3]!)
    expect(next(view).disabled).toBe(true)
    fireEvent.click(next(view))
    expect(root(view).getAttribute('data-step-index')).toBe('3')
  })

  it('leaves the control keys to focused controls', () => {
    const view = render(deck())
    const control = next(view)
    control.focus()
    const event = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true })
    act(() => {
      control.dispatchEvent(event)
    })
    expect(event.defaultPrevented).toBe(false)
    expect(root(view).getAttribute('data-step-index')).toBe('0')
  })
})

afterEach(() => {
  // Each test leaves a clean viewport for the next.
  setViewportWidth(1024)
})
