import { act, cleanup, createEvent, fireEvent, render, renderHook, waitFor } from '@testing-library/react'
import { StrictMode } from 'react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Presentation } from './Presentation'
import type { SceneProps, Step } from './types'
import { usePresentationNav } from './usePresentationNav'

type Payload = { label: string }

const Scene = ({ payload }: SceneProps<Payload>) => <div data-testid="scene">{payload.label}</div>

// Nine steps. Era runs: A A B B C | A (repeated era) | D D D.
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
  mode: root().dataset.presentationMode,
})
const progressItems = () =>
  Array.from(document.querySelectorAll<HTMLButtonElement>('[data-presentation-progress-item]'))
const tocItems = () =>
  Array.from(document.querySelectorAll<HTMLButtonElement>('[data-presentation-toc-item]'))
const sceneTexts = () =>
  Array.from(document.querySelectorAll('[data-testid="scene"]')).map((n) => n.textContent)
const footerTitle = () => document.querySelector('[data-presentation-footer] [data-presentation-title]')!.textContent

const press = (key: string, target: Element | Document | Window = document.body, mods: KeyboardEventInit = {}) =>
  fireEvent.keyDown(target, { key, ...mods })

let listeners: Array<() => void> = []
function setViewport(width: number) {
  Object.defineProperty(window, 'innerWidth', { configurable: true, writable: true, value: width })
  act(() => {
    listeners.forEach((cb) => cb())
  })
}

/** matchMedia stub that answers min-width queries from innerWidth and notifies listeners on change. */
beforeEach(() => {
  listeners = []
  setViewport(1280)
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

/** Renders the nine-step deck in browse mode and jumps to `index` through a progress item. */
function renderAt(index: number, extra: { brand?: ReactNode; initialMode?: 'browse' | 'present' } = {}) {
  render(<Presentation steps={steps} title="Deck" {...extra} />)
  if (index !== 0) fireEvent.click(progressItems()[index])
  expect(state().index).toBe(index)
}

const FORWARD = ['ArrowRight', ' ', 'PageDown'] as const
const BACKWARD = ['ArrowLeft', 'PageUp'] as const

describe('L-20 keyboard navigation advances or retreats exactly one step', () => {
  it.each([...FORWARD.map((k) => [k, 1] as const), ...BACKWARD.map((k) => [k, -1] as const)])(
    'key %j moves by %i',
    async (key, delta) => {
      renderAt(4)
      press(key)
      expect(state().index).toBe(4 + delta)
      expect(state().id).toBe(`s${4 + delta}`)
      expect(footerTitle()).toBe(`Title ${4 + delta}`)
      // The exiting scene stays mounted until its exit animation ends; wait for the new payload alone.
      await waitFor(() => expect(sceneTexts()).toEqual([`payload-${4 + delta}`]))
    },
  )

  it('ignores unrelated keys and leaves state unchanged', () => {
    renderAt(4)
    for (const key of ['a', 'Enter', 'ArrowUp', 'ArrowDown', 'Home', 'Escape']) press(key)
    expect(state()).toEqual({ index: 4, id: 's4', mode: 'browse' })
  })
})

const SWIPE_CASES: Array<[string, number, number, number]> = [
  // [label, dx, dy, expected delta]
  ['left swipe at threshold 50px advances', -50, 0, 1],
  ['right swipe at threshold 50px goes back', 50, 0, -1],
  ['left swipe with small vertical drift advances', -60, 10, 1],
  ['right swipe with small vertical drift goes back', 60, -10, -1],
  ['below threshold (49px) does not navigate', -49, 0, 0],
  ['vertical-dominant gesture does not navigate', -60, 80, 0],
  ['equal-axis travel does not navigate', -70, 70, 0],
  ['vertical swipe does not navigate', 0, 120, 0],
]

/** Dispatches a real touchstart/touchend pair with the given travel (fireEvent cannot set changedTouches). */
function swipe(el: Element, dx: number, dy: number) {
  const start = createEvent.touchStart(el)
  Object.defineProperty(start, 'changedTouches', { value: [{ clientX: 200, clientY: 200 }] })
  fireEvent(el, start)
  const end = createEvent.touchEnd(el)
  Object.defineProperty(end, 'changedTouches', { value: [{ clientX: 200 + dx, clientY: 200 + dy }] })
  fireEvent(el, end)
}

describe('L-21 touch swipe', () => {
  it.each(SWIPE_CASES)('%s', (_label, dx, dy, delta) => {
    renderAt(4)
    swipe(root(), dx, dy)
    expect(state().index).toBe(4 + delta)
    expect(footerTitle()).toBe(`Title ${4 + delta}`)
  })

  it('ignores a touchend without a matching touchstart', () => {
    renderAt(4)
    const end = createEvent.touchEnd(root())
    Object.defineProperty(end, 'changedTouches', { value: [{ clientX: 0, clientY: 0 }] })
    fireEvent(root(), end)
    expect(state().index).toBe(4)
  })
})

describe('L-22 direct jump via progress items and ToC entries', () => {
  it('activates every progress item and jumps to that step', () => {
    renderAt(0)
    expect(progressItems()).toHaveLength(9)
    for (let i = 0; i < 9; i++) {
      fireEvent.click(progressItems()[i])
      expect(state().index).toBe(i)
      expect(state().id).toBe(`s${i}`)
      expect(footerTitle()).toBe(`Title ${i}`)
    }
  })

  it('lists distinct eras in first-appearance order and jumps to the earliest step of each era', () => {
    setViewport(1280)
    renderAt(8)
    const labels = tocItems().map((b) => b.textContent)
    expect(labels).toEqual(['A', 'B', 'C', 'D'])

    const firstIndex = { A: 0, B: 2, C: 4, D: 6 } as const
    for (const label of ['D', 'C', 'B', 'A'] as const) {
      const btn = tocItems().find((b) => b.textContent === label)!
      fireEvent.click(btn)
      expect(state().index).toBe(firstIndex[label])
      expect(state().id).toBe(`s${firstIndex[label]}`)
      expect(footerTitle()).toBe(`Title ${firstIndex[label]}`)
    }
  })

  it('jumps the repeated era A to index 0, not its later occurrence at index 5', () => {
    setViewport(1280)
    renderAt(5)
    expect(state().index).toBe(5)
    fireEvent.click(tocItems()[0])
    expect(state().index).toBe(0)
  })
})

describe('L-23 active navigation state is exposed and tracks navigation', () => {
  function expectActive(index: number) {
    const progress = progressItems()
    const current = progress.filter((b) => b.getAttribute('aria-current') === 'step')
    expect(current).toHaveLength(1)
    expect(progress.indexOf(current[0])).toBe(index)
    expect(current[0].dataset.presentationActive).toBe('true')
    progress.forEach((b, i) => {
      if (i === index) return
      expect(b.hasAttribute('aria-current')).toBe(false)
      expect(b.hasAttribute('data-presentation-active')).toBe(false)
    })

    const toc = tocItems()
    const tocCurrent = toc.filter((b) => b.getAttribute('aria-current') === 'step')
    expect(tocCurrent).toHaveLength(1)
    expect(tocCurrent[0].textContent).toBe(ERAS[index])
    expect(tocCurrent[0].dataset.presentationActive).toBe('true')
    toc.forEach((b) => {
      if (b === tocCurrent[0]) return
      expect(b.hasAttribute('aria-current')).toBe(false)
      expect(b.hasAttribute('data-presentation-active')).toBe(false)
    })
  }

  it('moves the single current marker through next, previous, progress, and ToC', () => {
    setViewport(1280)
    renderAt(0)
    expectActive(0)

    press('ArrowRight')
    expectActive(1)
    fireEvent.click(nextBtn())
    expectActive(2)
    fireEvent.click(prevBtn())
    expectActive(1)

    fireEvent.click(progressItems()[4])
    expectActive(4)
    fireEvent.click(tocItems()[3]) // era D, first index 6
    expectActive(6)
    fireEvent.click(tocItems()[0]) // era A, first index 0
    expectActive(0)
  })
})

const nextBtn = () => document.querySelector<HTMLButtonElement>('[data-presentation-next]')!
const prevBtn = () => document.querySelector<HTMLButtonElement>('[data-presentation-prev]')!

/** Interactive fixtures hosted in the brand slot, each with a nested child element. */
const interactive = (
  <div>
    <button type="button" data-testid="button"><span data-testid="button-inner">b</span></button>
    <a href="#x" data-testid="anchor"><span data-testid="anchor-inner">a</span></a>
    <input data-testid="input" />
    <select data-testid="select"><option>one</option></select>
    <textarea data-testid="textarea" />
    <details>
      <summary data-testid="summary"><span data-testid="summary-inner">s</span></summary>
    </details>
    <div contentEditable suppressContentEditableWarning data-testid="editable">
      <span data-testid="editable-inner">e</span>
    </div>
    <div role="button" data-testid="role-button"><span data-testid="role-button-inner">rb</span></div>
    <div role="link" data-testid="role-link"><span data-testid="role-link-inner">rl</span></div>
    <div role="tab" data-testid="role-tab"><span data-testid="role-tab-inner">rt</span></div>
    <div data-testid="plain">plain</div>
  </div>
)

const INTERACTIVE_IDS = [
  'button',
  'button-inner',
  'anchor',
  'anchor-inner',
  'input',
  'select',
  'textarea',
  'summary',
  'summary-inner',
  'editable',
  'editable-inner',
  'role-button',
  'role-button-inner',
  'role-link',
  'role-link-inner',
  'role-tab',
  'role-tab-inner',
] as const

const ALL_KEYS = ['ArrowRight', ' ', 'PageDown', 'ArrowLeft', 'PageUp', 'p', 'P']

describe('L-24 focused interactive controls keep their keys', () => {
  it.each(INTERACTIVE_IDS)('target %s: no step or mode change and key not prevented', (id) => {
    renderAt(4, { brand: interactive })
    const target = document.querySelector(`[data-testid="${id}"]`)!
    for (const key of ALL_KEYS) {
      const notPrevented = press(key, target)
      expect(notPrevented).toBe(true)
    }
    expect(state()).toEqual({ index: 4, id: 's4', mode: 'browse' })
  })

  it.each(['ArrowRight', 'p'])('modified %s is ignored on a noninteractive target', (key) => {
    renderAt(4, { brand: interactive })
    const plain = document.querySelector('[data-testid="plain"]')!
    for (const mods of [{ ctrlKey: true }, { metaKey: true }, { altKey: true }]) {
      press(key, plain, mods)
    }
    expect(state()).toEqual({ index: 4, id: 's4', mode: 'browse' })
  })

  it('still navigates when the target is a noninteractive element, and prevents native scroll', () => {
    renderAt(4, { brand: interactive })
    const plain = document.querySelector('[data-testid="plain"]')!
    expect(press('ArrowRight', plain)).toBe(false)
    expect(state().index).toBe(5)
    expect(press('p', plain)).toBe(true)
    expect(state().mode).toBe('present')
  })
})

describe('L-25 navigation clamps at both ends', () => {
  it('stays on the first step for every backward input and never wraps', () => {
    renderAt(0)
    for (let i = 0; i < 3; i++) {
      press('ArrowLeft')
      press('PageUp')
    }
    swipe(root(), 100, 0)
    expect(state().index).toBe(0)
    expect(footerTitle()).toBe('Title 0')
    expect(prevBtn().disabled).toBe(true)
    fireEvent.click(prevBtn())
    expect(state().index).toBe(0)
  })

  it('stays on the last step for every forward input and never wraps', () => {
    renderAt(8)
    for (let i = 0; i < 3; i++) {
      press('ArrowRight')
      press(' ')
      press('PageDown')
    }
    swipe(root(), -100, 0)
    expect(state().index).toBe(8)
    expect(footerTitle()).toBe('Title 8')
    expect(nextBtn().disabled).toBe(true)
    fireEvent.click(nextBtn())
    expect(state().index).toBe(8)
  })
})

describe('X-4 navigation hook under StrictMode', () => {
  const StrictWrapper = ({ children }: { children: ReactNode }) => <StrictMode>{children}</StrictMode>

  function activeListeners(type: string, addSpy: { mock: { calls: unknown[][] } }, removeSpy: { mock: { calls: unknown[][] } }) {
    const added = addSpy.mock.calls.filter((c) => c[0] === type).map((c) => c[1])
    const removed = removeSpy.mock.calls.filter((c) => c[0] === type).map((c) => c[1])
    return added.filter((fn) => !removed.includes(fn))
  }

  it('keeps exactly one active keydown listener, produces one transition per key, and cleans up on unmount', () => {
    const addSpy = vi.spyOn(window, 'addEventListener')
    const removeSpy = vi.spyOn(window, 'removeEventListener')

    const { result, unmount } = renderHook(() => usePresentationNav(steps.length), { wrapper: StrictWrapper })
    expect(activeListeners('keydown', addSpy, removeSpy)).toHaveLength(1)

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }))
    })
    expect(result.current.index).toBe(1)

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'p' }))
    })
    expect(result.current.mode).toBe('present')
    expect(result.current.index).toBe(1)

    unmount()
    expect(activeListeners('keydown', addSpy, removeSpy)).toHaveLength(0)
  })

  it('applies one transition per swipe under StrictMode', () => {
    const { result } = renderHook(() => usePresentationNav(steps.length), { wrapper: StrictWrapper })
    act(() => {
      result.current.touchHandlers.onTouchStart({
        changedTouches: [{ clientX: 300, clientY: 0 }],
      } as unknown as Parameters<typeof result.current.touchHandlers.onTouchStart>[0])
    })
    act(() => {
      result.current.touchHandlers.onTouchEnd({
        changedTouches: [{ clientX: 200, clientY: 0 }],
      } as unknown as Parameters<typeof result.current.touchHandlers.onTouchEnd>[0])
    })
    expect(result.current.index).toBe(1)
  })

  it('a Presentation under StrictMode advances exactly one step per key press', () => {
    render(
      <StrictMode>
        <Presentation steps={steps} title="Deck" />
      </StrictMode>,
    )
    press('ArrowRight')
    expect(state().index).toBe(1)
    press('PageDown')
    expect(state().index).toBe(2)
  })
})
