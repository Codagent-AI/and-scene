import { act, fireEvent, render, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { usePresentationNav } from '../../src/presentation-kit/usePresentationNav'
import { SWIPE_MIN_DISTANCE } from '../../src/presentation-kit/constants'
import type { Mode } from '../../src/presentation-kit/constants'

const COUNT = 5

function pressKey(key: string, modifiers: { ctrlKey?: boolean; metaKey?: boolean; altKey?: boolean } = {}) {
  window.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...modifiers }))
}

function swipe(dx: number, dy: number, start = { x: 300, y: 300 }) {
  const startEvent = new Event('touchstart', { bubbles: true })
  Object.defineProperty(startEvent, 'touches', { value: [{ clientX: start.x, clientY: start.y }] })
  window.dispatchEvent(startEvent)
  const endEvent = new Event('touchend', { bubbles: true })
  Object.defineProperty(endEvent, 'changedTouches', {
    value: [{ clientX: start.x + dx, clientY: start.y + dy }],
  })
  window.dispatchEvent(endEvent)
}

function renderNav(initialMode?: Mode, startIndex = 2) {
  const hook = renderHook(() => usePresentationNav(COUNT, initialMode))
  act(() => hook.result.current.goTo(startIndex))
  return hook
}

describe('I-20 keyboard advance and back', () => {
  it.each(['ArrowRight', ' ', 'PageDown'])('%j advances exactly one step from the middle', (key) => {
    const { result } = renderNav()
    act(() => pressKey(key))
    expect(result.current.index).toBe(3)
  })

  it.each(['ArrowLeft', 'PageUp'])('%j goes back exactly one step from the middle', (key) => {
    const { result } = renderNav()
    act(() => pressKey(key))
    expect(result.current.index).toBe(1)
  })

  it.each(['ArrowUp', 'ArrowDown', 'Enter', 'Home', 'End', 'a', 'Tab', 'Escape'])('%j leaves the index unchanged', (key) => {
    const { result } = renderNav()
    act(() => pressKey(key))
    expect(result.current.index).toBe(2)
    expect(result.current.mode).toBe('browse')
  })
})

describe('I-21 touch swipe', () => {
  it('a left swipe past the threshold advances and a right swipe goes back', () => {
    const { result } = renderNav()
    act(() => swipe(-120, 4))
    expect(result.current.index).toBe(3)
    act(() => swipe(120, -4))
    expect(result.current.index).toBe(2)
  })

  it('accepts travel exactly at the distance threshold and rejects one pixel short', () => {
    const { result } = renderNav()
    act(() => swipe(-(SWIPE_MIN_DISTANCE - 1), 0))
    expect(result.current.index).toBe(2)
    act(() => swipe(-SWIPE_MIN_DISTANCE, 0))
    expect(result.current.index).toBe(3)
    act(() => swipe(SWIPE_MIN_DISTANCE - 1, 0))
    expect(result.current.index).toBe(3)
    act(() => swipe(SWIPE_MIN_DISTANCE, 0))
    expect(result.current.index).toBe(2)
  })

  it('ignores short horizontal gestures on both sides of the threshold', () => {
    const { result } = renderNav()
    act(() => swipe(-20, 0))
    act(() => swipe(20, 0))
    expect(result.current.index).toBe(2)
  })

  it('ignores predominantly vertical gestures', () => {
    const { result } = renderNav()
    act(() => swipe(-10, -200))
    act(() => swipe(10, 200))
    expect(result.current.index).toBe(2)
  })

  it('ignores diagonal gestures whose horizontal travel does not dominate by the axis ratio', () => {
    const { result } = renderNav()
    // |dx| = 100 < 1.5 * |dy| = 120: rejected.
    act(() => swipe(-100, -80))
    expect(result.current.index).toBe(2)
    // |dx| = 100 >= 1.5 * |dy| = 90: accepted.
    act(() => swipe(-100, -60))
    expect(result.current.index).toBe(3)
  })

  it('does nothing when touchend arrives without a preceding touchstart', () => {
    const { result } = renderHook(() => usePresentationNav(COUNT))
    const endEvent = new Event('touchend', { bubbles: true })
    Object.defineProperty(endEvent, 'changedTouches', { value: [{ clientX: 0, clientY: 0 }] })
    act(() => {
      window.dispatchEvent(endEvent)
    })
    expect(result.current.index).toBe(0)
  })
})

describe('I-19 mode toggling preserves position (hook level)', () => {
  it.each<Mode>(['browse', 'present'])('starts in %s when requested', (mode) => {
    const { result } = renderHook(() => usePresentationNav(COUNT, mode))
    expect(result.current.mode).toBe(mode)
  })

  it('P toggles browse to present and back from a middle step without moving the index', () => {
    const { result } = renderNav('browse')
    act(() => pressKey('p'))
    expect(result.current.mode).toBe('present')
    expect(result.current.index).toBe(2)
    act(() => pressKey('P'))
    expect(result.current.mode).toBe('browse')
    expect(result.current.index).toBe(2)
  })

  it('toggles from present to browse and back from a middle step', () => {
    const { result } = renderNav('present')
    act(() => pressKey('P'))
    expect(result.current.mode).toBe('browse')
    act(() => pressKey('p'))
    expect(result.current.mode).toBe('present')
    expect(result.current.index).toBe(2)
  })
})

describe('I-25 boundary clamping (hook level)', () => {
  it('prev stays at the first step when repeated and never wraps', () => {
    const { result } = renderNav(undefined, 0)
    act(() => result.current.prev())
    act(() => result.current.prev())
    expect(result.current.index).toBe(0)
    act(() => pressKey('ArrowLeft'))
    act(() => pressKey('PageUp'))
    expect(result.current.index).toBe(0)
    act(() => swipe(120, 0))
    expect(result.current.index).toBe(0)
  })

  it('next stays at the last step when repeated and never wraps', () => {
    const { result } = renderNav(undefined, COUNT - 1)
    act(() => result.current.next())
    act(() => result.current.next())
    expect(result.current.index).toBe(COUNT - 1)
    act(() => pressKey('ArrowRight'))
    act(() => pressKey(' '))
    act(() => pressKey('PageDown'))
    expect(result.current.index).toBe(COUNT - 1)
    act(() => swipe(-120, 0))
    expect(result.current.index).toBe(COUNT - 1)
  })

  it('goTo clamps out-of-range targets at both ends', () => {
    const { result } = renderNav()
    act(() => result.current.goTo(-3))
    expect(result.current.index).toBe(0)
    act(() => result.current.goTo(99))
    expect(result.current.index).toBe(COUNT - 1)
  })

  it('stays at zero for an empty deck', () => {
    const { result } = renderHook(() => usePresentationNav(0))
    act(() => result.current.next())
    expect(result.current.index).toBe(0)
  })
})

describe('I-24 controls keep their keys', () => {
  const NAV_KEYS = ['ArrowRight', 'ArrowLeft', ' ', 'PageDown', 'PageUp', 'p', 'P']

  function Harness() {
    const nav = usePresentationNav(COUNT)
    return (
      <div>
        <div data-testid="state" data-index={nav.index} data-mode={nav.mode} />
        <button type="button" data-testid="button">
          <span data-testid="button-inner">Button</span>
        </button>
        <a data-testid="link" href="#somewhere">
          link
        </a>
        <input data-testid="input" />
        <select data-testid="select">
          <option>one</option>
        </select>
        <textarea data-testid="textarea" />
        <details data-testid="details">
          <summary data-testid="summary">Summary</summary>
        </details>
        <div data-testid="editable" contentEditable="true">
          <span data-testid="editable-inner">edit</span>
        </div>
        <div data-testid="role-slider" role="slider" tabIndex={0} />
        <div data-testid="role-tab" role="tab" tabIndex={0} />
        <div data-testid="role-checkbox" role="checkbox" tabIndex={0} />
        <div data-testid="role-menuitem" role="menuitem" tabIndex={0} />
        <div data-testid="role-textbox" role="textbox" tabIndex={0} />
        <div data-testid="role-spinbutton" role="spinbutton" tabIndex={0} />
        <div data-testid="role-searchbox" role="searchbox" tabIndex={0} />
        <div data-testid="role-treeitem" role="treeitem" tabIndex={0} />
        <div data-testid="role-menuitemcheckbox" role="menuitemcheckbox" tabIndex={0} />
        <div data-testid="role-menuitemradio" role="menuitemradio" tabIndex={0} />
        <div data-testid="role-gridcell" role="gridcell" tabIndex={0} />
        <div data-testid="role-combobox" role="combobox" tabIndex={0} />
        <div data-testid="role-option" role="option" tabIndex={0} />
        <div data-testid="role-switch" role="switch" tabIndex={0} />
        <div data-testid="plain-content">plain</div>
      </div>
    )
  }

  function read(container: HTMLElement) {
    const state = container.querySelector('[data-testid="state"]') as HTMLElement
    return { index: Number(state.dataset.index), mode: state.dataset.mode }
  }

  it.each([
    'button',
    'button-inner',
    'link',
    'input',
    'select',
    'textarea',
    'summary',
    'editable',
    'editable-inner',
    'role-slider',
    'role-tab',
    'role-checkbox',
    'role-menuitem',
    'role-textbox',
    'role-spinbutton',
    'role-searchbox',
    'role-treeitem',
    'role-menuitemcheckbox',
    'role-menuitemradio',
    'role-gridcell',
    'role-combobox',
    'role-option',
    'role-switch',
  ])('navigation keys fired from %s do not move the deck or get prevented', (testId) => {
    const { container } = render(<Harness />)
    const before = read(container)
    const target = container.querySelector(`[data-testid="${testId}"]`) as HTMLElement
    for (const key of NAV_KEYS) {
      // fireEvent returns false when the deck's handler called preventDefault.
      const notPrevented = fireEvent.keyDown(target, { key })
      expect(notPrevented, `${key} on ${testId}`).toBe(true)
      expect(read(container), `${key} on ${testId}`).toEqual(before)
    }
  })

  it('still navigates when keys come from ordinary non-interactive content', () => {
    const { container } = render(<Harness />)
    const plain = container.querySelector('[data-testid="plain-content"]') as HTMLElement
    fireEvent.keyDown(plain, { key: 'ArrowRight' })
    expect(read(container).index).toBe(1)
  })

  it.each(NAV_KEYS)('ignores %s with Ctrl, Meta, or Alt held on ordinary content', (key) => {
    const { container } = render(<Harness />)
    const plain = container.querySelector('[data-testid="plain-content"]') as HTMLElement
    const before = read(container)
    for (const modifiers of [{ ctrlKey: true }, { metaKey: true }, { altKey: true }]) {
      const notPrevented = fireEvent.keyDown(plain, { key, ...modifiers })
      expect(notPrevented).toBe(true)
      expect(read(container)).toEqual(before)
    }
  })
})
