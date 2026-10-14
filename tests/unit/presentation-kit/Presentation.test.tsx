import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { Presentation, type PresentationProps } from '../../../src/presentation-kit/Presentation'
import { DESIGN_H, DESIGN_W, WIDE_VIEWPORT } from '../../../src/presentation-kit/constants'
import { computeFitScale } from '../../../src/presentation-kit/geometry'
import { FIXTURE_STEPS } from './fixture-steps'
import type { CounterPayload } from './fixtures'

const ATTRIBUTION_URL = 'https://github.com/Codagent-AI/and-scene'

function renderDeck(props: Partial<PresentationProps<CounterPayload>> = {}) {
  return render(<Presentation steps={FIXTURE_STEPS} title="Fixture talk" {...props} />)
}

function root() {
  const element = document.querySelector<HTMLElement>('[data-presentation-root]')
  if (!element) throw new Error('presentation root missing')
  return element
}

function press(key: string, target: EventTarget = window) {
  act(() => {
    target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }))
  })
}

function setViewportWidth(width: number) {
  Object.defineProperty(window, 'innerWidth', { configurable: true, writable: true, value: width })
}

describe('Presentation', () => {
  const originalWidth = window.innerWidth

  beforeEach(() => {
    setViewportWidth(1280)
    window.history.replaceState(null, '', '/')
  })

  afterEach(() => {
    setViewportWidth(originalWidth)
  })

  it('exposes step count, derived index, and position-derived marker numbers', () => {
    renderDeck()
    expect(root().getAttribute('data-step-count')).toBe('3')
    expect(root().getAttribute('data-step-index')).toBe('0')
    expect(screen.getByText('01')).toBeTruthy()
  })

  it('advances with the keyboard and clamps at the last step', () => {
    renderDeck()
    press('ArrowRight')
    expect(root().getAttribute('data-step-index')).toBe('1')
    press('ArrowRight')
    press('ArrowRight')
    press('ArrowRight')
    expect(root().getAttribute('data-step-index')).toBe('2')
  })

  it('updates a grouped scene in place instead of remounting it', async () => {
    renderDeck()
    const before = screen.getByTestId('counter-scene').getAttribute('data-instance')

    press('ArrowRight')

    const after = screen.getByTestId('counter-scene')
    expect(after.getAttribute('data-instance')).toBe(before)
    expect(within(after).getByText('two')).toBeTruthy()
  })

  it('gives steps that share a groupKey but use different scenes their own layer', () => {
    const mixed = [
      { ...FIXTURE_STEPS[0], groupKey: 'shared' },
      { ...FIXTURE_STEPS[2], groupKey: 'shared' },
    ]
    render(<Presentation steps={mixed} title="Mixed" />)
    const before = document.querySelector('[data-presentation-scene-layer]')

    press('ArrowRight')

    // Fixture scenes render their own SceneLayer, so take the outermost layer
    // holding the diagram: document order lists ancestors first.
    const diagramBox = document.querySelector('[data-presentation-id="diagram-box"]')
    const outerLayer = Array.from(document.querySelectorAll('[data-presentation-scene-layer]')).find((layer) =>
      layer.contains(diagramBox),
    )
    expect(outerLayer).toBeTruthy()
    expect(outerLayer).not.toBe(before)
  })

  it('cross-fades into a non-grouped step with a different scene', async () => {
    renderDeck()
    press('ArrowRight')
    press('ArrowRight')
    await waitFor(() => expect(document.querySelector('[data-presentation-id="diagram-box"]')).toBeTruthy())
  })

  it('toggles mode without changing the step and hides browse chrome in present mode', () => {
    renderDeck()
    press('ArrowRight')
    fireEvent.click(screen.getByRole('button', { name: /present/i }))
    expect(root().getAttribute('data-presentation-mode')).toBe('present')
    expect(root().getAttribute('data-step-index')).toBe('1')
    expect(document.querySelector('[data-presentation-caption]')).toBeNull()
    expect(document.querySelector('[data-presentation-prev]')).toBeNull()
    expect(document.querySelector('[data-presentation-toc]')).toBeNull()
  })

  it('shows caption, prev/next, and progress in browse mode', () => {
    renderDeck()
    expect(document.querySelector('[data-presentation-caption]')?.textContent).toBe(
      'The counter starts at one.',
    )
    expect(document.querySelector('[data-presentation-prev]')).not.toBeNull()
    expect(document.querySelector('[data-presentation-next]')).not.toBeNull()
  })

  it('marks the active progress indicator with aria-current and a stable active hook', () => {
    renderDeck()
    press('ArrowRight')
    const items = document.querySelectorAll<HTMLElement>('[data-presentation-progress-item]')
    expect(items).toHaveLength(3)
    expect(items[1].getAttribute('aria-current')).toBe('step')
    expect(items[1].getAttribute('data-presentation-active')).toBe('true')
    expect(items[0].hasAttribute('aria-current')).toBe(false)
    expect(items[0].getAttribute('data-presentation-active')).toBe('false')
  })

  it('jumps directly to a step from a progress indicator', () => {
    renderDeck()
    const items = document.querySelectorAll<HTMLElement>('[data-presentation-progress-item]')
    fireEvent.click(items[2])
    expect(root().getAttribute('data-step-index')).toBe('2')
  })

  it('shows a table of contents on wide viewports and jumps to the era start', () => {
    setViewportWidth(WIDE_VIEWPORT)
    renderDeck()
    const toc = document.querySelector<HTMLElement>('[data-presentation-toc]')
    if (!toc) throw new Error('toc missing on wide viewport')
    const entries = toc.querySelectorAll<HTMLElement>('[data-presentation-toc-entry]')
    expect(entries).toHaveLength(2)

    fireEvent.click(entries[1])
    expect(root().getAttribute('data-step-index')).toBe('2')
    expect(entries[1].getAttribute('aria-current')).toBe('step')
    expect(entries[1].getAttribute('data-presentation-active')).toBe('true')
  })

  it('hides the table of contents on narrow viewports', () => {
    setViewportWidth(WIDE_VIEWPORT - 1)
    renderDeck()
    expect(document.querySelector('[data-presentation-toc]')).toBeNull()
  })

  it('renders no and-scene brand link in the header by default', () => {
    renderDeck()
    const header = document.querySelector('[data-presentation-header]')
    expect(header).not.toBeNull()
    expect(header?.querySelector(`a[href="${ATTRIBUTION_URL}"]`)).toBeNull()
    expect(document.querySelector('[data-presentation-brand]')).toBeNull()
  })

  it('renders the default attribution link with a stable hook', () => {
    renderDeck()
    const attribution = document.querySelector<HTMLAnchorElement>('[data-presentation-attribution]')
    expect(attribution?.textContent).toBe('made by and-scene')
    expect(attribution?.getAttribute('href')).toBe(ATTRIBUTION_URL)
  })

  it('omits attribution only when explicitly disabled', () => {
    renderDeck({ attribution: false })
    expect(document.querySelector('[data-presentation-attribution]')).toBeNull()
  })

  it('lets a host opt in to a top-left brand slot', () => {
    renderDeck({ brand: <span data-testid="host-brand">Host</span> })
    const brand = document.querySelector('[data-presentation-brand]')
    expect(brand?.contains(screen.getByTestId('host-brand'))).toBe(true)
  })

  it('scales the 880 x 380 canvas by the fit scale for the current viewport', () => {
    renderDeck({ initialMode: 'present' })
    const canvas = document.querySelector<HTMLElement>('[data-presentation-canvas]')
    if (!canvas) throw new Error('canvas missing')
    const scale = computeFitScale({
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      mode: 'present',
    })
    expect(canvas.style.width).toBe(`${DESIGN_W * scale}px`)
    expect(canvas.style.height).toBe(`${DESIGN_H * scale}px`)
  })

  it('navigates with a horizontal swipe and ignores swipes that start on a control', () => {
    renderDeck()
    fireEvent.touchStart(root(), { touches: [{ clientX: 300, clientY: 100 }] })
    fireEvent.touchEnd(root(), { changedTouches: [{ clientX: 120, clientY: 104 }] })
    expect(root().getAttribute('data-step-index')).toBe('1')

    fireEvent.touchStart(root(), { touches: [{ clientX: 120, clientY: 100 }] })
    fireEvent.touchEnd(root(), { changedTouches: [{ clientX: 300, clientY: 100 }] })
    expect(root().getAttribute('data-step-index')).toBe('0')

    const next = document.querySelector<HTMLElement>('[data-presentation-next]')
    if (!next) throw new Error('next control missing')
    fireEvent.touchStart(next, { touches: [{ clientX: 300, clientY: 100 }] })
    fireEvent.touchEnd(next, { changedTouches: [{ clientX: 120, clientY: 100 }] })
    expect(root().getAttribute('data-step-index')).toBe('0')
  })

  it('leaves keys to a focused control instead of advancing the deck', () => {
    renderDeck()
    const next = document.querySelector<HTMLElement>('[data-presentation-next]')
    if (!next) throw new Error('next control missing')
    next.focus()
    press('ArrowRight', next)
    expect(root().getAttribute('data-step-index')).toBe('0')
  })
})
