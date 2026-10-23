// @vitest-environment jsdom
import { act, fireEvent, render } from '@testing-library/react'
import { StrictMode } from 'react'
import { describe, expect, it } from 'vitest'
import { classifySwipe, isInteractiveTarget, keyAction, usePresentationNav } from '../usePresentationNav'
import { SWIPE_MIN_PX } from '../constants'

function Harness({ count, initial = 'browse' }: { count: number; initial?: 'browse' | 'present' }) {
  const nav = usePresentationNav(count, initial)
  return (
    <div data-testid="state" data-index={nav.index} data-mode={nav.mode}>
      <button type="button" data-testid="control">control</button>
      <input data-testid="field" />
      <div data-testid="plain" />
      <a href="#x" data-testid="link">
        link
      </a>
      <div role="menu" data-testid="menu">
        <span data-testid="menu-child" />
      </div>
      <div contentEditable data-testid="editable">
        <span data-testid="editable-child" />
      </div>
      <select data-testid="select">
        <option>one</option>
      </select>
      <textarea data-testid="area" />
      <details>
        <summary data-testid="summary">summary</summary>
      </details>
      <span data-testid="index-probe" data-last={nav.last} />
    </div>
  )
}

const state = (view: ReturnType<typeof render>) => view.getByTestId('state')
const index = (view: ReturnType<typeof render>) => Number(state(view).getAttribute('data-index'))
const mode = (view: ReturnType<typeof render>) => state(view).getAttribute('data-mode')
const press = (target: Element | Window, key: string, init: KeyboardEventInit = {}) => {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init })
  act(() => {
    target.dispatchEvent(event)
  })
  return event
}

describe('keyboard navigation', () => {
  it.each([
    ['ArrowRight', 1],
    [' ', 1],
    ['PageDown', 1],
    ['ArrowLeft', -1],
    ['PageUp', -1],
  ])('moves exactly one step for %j', (key, delta) => {
    const view = render(<Harness count={9} />)
    act(() => {
      fireEvent.click(view.getByTestId('control'))
    })
    press(document.body, 'ArrowRight')
    press(document.body, 'ArrowRight')
    const before = index(view)
    press(document.body, key)
    expect(index(view) - before).toBe(delta)
  })

  it('calls preventDefault on handled keys', () => {
    const view = render(<Harness count={3} />)
    const event = press(document.body, 'ArrowRight')
    expect(event.defaultPrevented).toBe(true)
    expect(index(view)).toBe(1)
  })

  it('ignores keys with Ctrl, Meta, or Alt modifiers', () => {
    const view = render(<Harness count={3} />)
    press(document.body, 'ArrowRight', { ctrlKey: true })
    press(document.body, 'ArrowRight', { metaKey: true })
    press(document.body, 'ArrowRight', { altKey: true })
    expect(index(view)).toBe(0)
  })

  it('does not double-advance after remounting the listener', () => {
    const view = render(<Harness count={5} />)
    view.unmount()
    const again = render(<Harness count={5} />)
    press(document.body, 'ArrowRight')
    expect(index(again)).toBe(1)
  })

  it('clamps at both ends with no wrap-around', () => {
    const view = render(<Harness count={3} />)
    press(document.body, 'ArrowLeft')
    expect(index(view)).toBe(0)
    press(document.body, 'ArrowRight')
    press(document.body, 'ArrowRight')
    press(document.body, 'ArrowRight')
    expect(index(view)).toBe(2)
  })

  it('keeps a one-step deck on its only step', () => {
    const view = render(<Harness count={1} />)
    press(document.body, 'ArrowRight')
    press(document.body, 'ArrowLeft')
    expect(index(view)).toBe(0)
    expect(view.getByTestId('index-probe').getAttribute('data-last')).toBe('0')
  })

  it.each(['p', 'P'])('toggles mode with %j and keeps the active step', (key) => {
    const view = render(<Harness count={9} />)
    press(document.body, 'ArrowRight')
    press(document.body, 'ArrowRight')
    press(document.body, 'ArrowRight')
    expect(mode(view)).toBe('browse')
    press(document.body, key)
    expect(mode(view)).toBe('present')
    expect(index(view)).toBe(3)
    press(document.body, key)
    expect(mode(view)).toBe('browse')
    expect(index(view)).toBe(3)
  })

  it('starts in the requested mode', () => {
    expect(mode(render(<Harness count={2} initial="present" />))).toBe('present')
  })

  it.each([
    ['a button', 'control'],
    ['a text field', 'field'],
    ['a link', 'link'],
    ['a select', 'select'],
    ['a textarea', 'area'],
    ['a summary', 'summary'],
    ['an element with a menu role', 'menu-child'],
    ['a contenteditable region', 'editable-child'],
  ])('leaves navigation keys to %s', (_label, testId) => {
    const view = render(<Harness count={5} />)
    const target = view.getByTestId(testId)
    for (const key of ['ArrowRight', ' ', 'PageDown', 'p']) {
      const event = press(target, key)
      expect(event.defaultPrevented).toBe(false)
    }
    expect(index(view)).toBe(0)
    expect(mode(view)).toBe('browse')
  })

  it('still navigates from a non-interactive element', () => {
    const view = render(<Harness count={5} />)
    press(view.getByTestId('plain'), 'ArrowRight')
    expect(index(view)).toBe(1)
  })

  it('classifies targets by interactivity', () => {
    const view = render(<Harness count={1} />)
    expect(isInteractiveTarget(view.getByTestId('control'))).toBe(true)
    expect(isInteractiveTarget(view.getByTestId('plain'))).toBe(false)
    expect(isInteractiveTarget(null)).toBe(false)
  })

  it('maps keys to actions', () => {
    expect(keyAction('Enter')).toBeNull()
    expect(keyAction('PageUp')).toBe('prev')
    expect(keyAction('p')).toBe('toggle-mode')
  })
})

function touch(target: Window, type: 'touchstart' | 'touchend', x: number, y: number) {
  const point = { clientX: x, clientY: y, identifier: 1, target: document.body } as unknown as Touch
  const event = new Event(type, { bubbles: true, cancelable: true }) as Event & { touches: Touch[]; changedTouches: Touch[] }
  Object.defineProperty(event, 'touches', { value: type === 'touchstart' ? [point] : [] })
  Object.defineProperty(event, 'changedTouches', { value: [point] })
  act(() => {
    target.dispatchEvent(event)
  })
}

function swipe(dx: number, dy: number) {
  touch(window, 'touchstart', 200, 200)
  touch(window, 'touchend', 200 + dx, 200 + dy)
}

describe('StrictMode and boundaries', () => {
  it('responds once per key under StrictMode double-mounting, and cleans up its listeners', () => {
    const view = render(
      <StrictMode>
        <Harness count={5} />
      </StrictMode>,
    )
    press(document.body, 'ArrowRight')
    expect(index(view)).toBe(1)
    view.unmount()
    press(document.body, 'ArrowRight')
    const again = render(
      <StrictMode>
        <Harness count={5} />
      </StrictMode>,
    )
    expect(index(again)).toBe(0)
  })
})

describe('touch swipe', () => {
  it('advances on a left swipe and goes back on a right swipe', () => {
    const view = render(<Harness count={5} />)
    swipe(-120, 4)
    expect(index(view)).toBe(1)
    swipe(120, -4)
    expect(index(view)).toBe(0)
  })

  it.each([
    ['below the threshold', -(SWIPE_MIN_PX - 1), 0, 0],
    ['exactly at the threshold', -SWIPE_MIN_PX, 0, 1],
    ['just above the threshold', -(SWIPE_MIN_PX + 1), 0, 1],
    ['vertical', 0, -200, 0],
    ['not dominant (dx equals 1.5 times dy)', -90, 60, 0],
    ['dominant just above 1.5 times dy', -91, 60, 1],
  ])('treats a gesture %s as expected', (_label, dx, dy, expected) => {
    const view = render(<Harness count={5} />)
    swipe(dx, dy)
    expect(index(view)).toBe(expected)
  })

  it('classifies swipes at the boundaries', () => {
    expect(classifySwipe(-40, 0)).toBe('left')
    expect(classifySwipe(40, 0)).toBe('right')
    expect(classifySwipe(-39.9, 0)).toBeNull()
    expect(classifySwipe(-90, 60)).toBeNull()
    expect(classifySwipe(-91, 60)).toBe('left')
  })

  it('clamps swipes at both ends with no wrap-around', () => {
    const view = render(<Harness count={3} />)
    swipe(120, 0)
    expect(index(view)).toBe(0)
    swipe(-120, 0)
    swipe(-120, 0)
    swipe(-120, 0)
    expect(index(view)).toBe(2)
  })

  it('removes touch listeners on unmount', () => {
    const view = render(<Harness count={5} />)
    view.unmount()
    touch(window, 'touchstart', 200, 200)
    touch(window, 'touchend', 100, 200)
    const again = render(<Harness count={5} />)
    expect(index(again)).toBe(0)
  })
})
