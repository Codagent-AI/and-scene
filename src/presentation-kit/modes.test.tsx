import { act, cleanup, fireEvent, render, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Presentation } from './Presentation'
import type { Mode, SceneProps, Step } from './types'

type Payload = { label: string }

const Scene = ({ payload }: SceneProps<Payload>) => <div data-testid="scene">{payload.label}</div>

const ERAS = ['A', 'A', 'B', 'B', 'C', 'A', 'D', 'D', 'D']
const steps: Step<Payload>[] = ERAS.map((era, i) => ({
  id: `s${i}`,
  era,
  title: `Title ${i}`,
  caption: `Caption ${i}`,
  Scene,
  payload: { label: `payload-${i}` },
}))

const root = () => document.querySelector<HTMLElement>('[data-presentation-root]')!
const state = () => ({
  index: Number(root().dataset.stepIndex),
  id: root().dataset.stepId,
  mode: root().dataset.presentationMode as Mode,
})
const modeToggle = () => document.querySelector<HTMLButtonElement>('[data-presentation-mode-toggle]')!
const sceneTexts = () =>
  Array.from(document.querySelectorAll('[data-testid="scene"]')).map((n) => n.textContent)

let listeners: Array<() => void> = []
beforeEach(() => {
  listeners = []
  Object.defineProperty(window, 'innerWidth', { configurable: true, writable: true, value: 1280 })
  window.matchMedia = ((query: string) => {
    const min = Number(/min-width:\s*(\d+)px/.exec(query)?.[1] ?? 0)
    return {
      media: query,
      onchange: null,
      get matches() {
        return window.innerWidth >= min
      },
      addEventListener: (_type: string, cb: () => void) => {
        listeners.push(cb)
      },
      removeEventListener: (_type: string, cb: () => void) => {
        listeners = listeners.filter((l) => l !== cb)
      },
      addListener() {},
      removeListener() {},
      dispatchEvent: () => false,
    }
  }) as unknown as typeof window.matchMedia
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  delete (window as { matchMedia?: unknown }).matchMedia
})

/** Browse-only chrome presence; present mode must hide every one of these. */
function expectBrowseChrome(present: boolean) {
  const q = (sel: string) => document.querySelector(sel)
  expect(q('[data-presentation-caption]') !== null).toBe(present)
  expect(q('[data-presentation-prev]') !== null).toBe(present)
  expect(q('[data-presentation-next]') !== null).toBe(present)
  expect(q('[data-presentation-progress]') !== null).toBe(present)
}

describe('L-18 initialMode is honored', () => {
  it('opens in browse mode by default with browse chrome', () => {
    render(<Presentation steps={steps} title="Deck" />)
    expect(state().mode).toBe('browse')
    expect(modeToggle().textContent).toBe('Present')
    expectBrowseChrome(true)
    expect(document.querySelector('[data-presentation-caption]')!.textContent).toBe('Caption 0')
  })

  it('opens in present mode when initialMode="present" with title-only chrome', () => {
    render(<Presentation steps={steps} title="Deck" initialMode="present" />)
    expect(state().mode).toBe('present')
    expect(modeToggle().textContent).toBe('Browse')
    expectBrowseChrome(false)
    expect(document.querySelector('[data-presentation-marker]')!.textContent).toBe('1 / 9')
    expect(document.querySelector('[data-presentation-footer] [data-presentation-title]')!.textContent).toBe(
      'Title 0',
    )
  })

  it('opens in browse mode when initialMode="browse" explicitly', () => {
    render(<Presentation steps={steps} title="Deck" initialMode="browse" />)
    expect(state().mode).toBe('browse')
    expectBrowseChrome(true)
  })
})

describe('L-19 mode toggle preserves position', () => {
  /** Index, active id, marker text, and the settled scene payload; none may change on a toggle. */
  const position = () => ({
    index: state().index,
    id: state().id,
    marker: document.querySelector('[data-presentation-marker]')!.textContent,
  })

  it.each([
    ['P key', (el: HTMLElement) => fireEvent.keyDown(el, { key: 'P' })],
    ['lowercase p key', (el: HTMLElement) => fireEvent.keyDown(el, { key: 'p' })],
    ['mode control', () => fireEvent.click(modeToggle())],
  ])('toggles browse -> present -> browse with %s from a middle step', async (_label, toggle) => {
    render(<Presentation steps={steps} title="Deck" />)
    fireEvent.click(document.querySelectorAll('[data-presentation-progress-item]')[4] as HTMLElement)
    expect(state().index).toBe(4)
    const before = position()
    await waitFor(() => expect(sceneTexts()).toEqual(['payload-4']))

    toggle(document.body)
    expect(state().mode).toBe('present')
    expectBrowseChrome(false)
    expect(document.querySelector('[data-presentation-footer] [data-presentation-title]')!.textContent).toBe(
      'Title 4',
    )
    expect(position()).toEqual(before)
    await waitFor(() => expect(sceneTexts()).toEqual(['payload-4']))

    toggle(document.body)
    expect(state().mode).toBe('browse')
    expectBrowseChrome(true)
    expect(document.querySelector('[data-presentation-caption]')!.textContent).toBe('Caption 4')
    expect(position()).toEqual(before)
    await waitFor(() => expect(sceneTexts()).toEqual(['payload-4']))
  })

  it('keeps the position when the mode is changed from present mode via the control', async () => {
    render(<Presentation steps={steps} title="Deck" initialMode="present" />)
    fireEvent.keyDown(document.body, { key: 'ArrowRight' })
    fireEvent.keyDown(document.body, { key: 'ArrowRight' })
    fireEvent.keyDown(document.body, { key: 'ArrowRight' })
    fireEvent.keyDown(document.body, { key: 'ArrowRight' })
    expect(state().index).toBe(4)

    fireEvent.click(modeToggle())
    expect(state().mode).toBe('browse')
    expect(state().index).toBe(4)
    expect(state().id).toBe('s4')
    expect(document.querySelector('[data-presentation-caption]')!.textContent).toBe('Caption 4')
    await waitFor(() => expect(sceneTexts()).toEqual(['payload-4']))
  })

  it('P on the focused mode control is not a deck command; the control toggles once per click', () => {
    render(<Presentation steps={steps} title="Deck" />)
    fireEvent.click(document.querySelectorAll('[data-presentation-progress-item]')[2] as HTMLElement)
    act(() => {
      modeToggle().focus()
    })
    // Keys on the focused control are not deck commands; the control itself still toggles.
    fireEvent.keyDown(modeToggle(), { key: 'p' })
    expect(state().mode).toBe('browse')
    expect(state().index).toBe(2)
    fireEvent.click(modeToggle())
    expect(state().mode).toBe('present')
    expect(state().index).toBe(2)
  })
})
