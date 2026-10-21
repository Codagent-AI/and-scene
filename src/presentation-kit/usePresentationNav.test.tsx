import { StrictMode } from 'react'
import { act, fireEvent, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { SWIPE_MIN_PX } from './constants'
import { classifySwipe, keyToAction, usePresentationNav } from './usePresentationNav'

function setup(options: Parameters<typeof usePresentationNav>[0] = { count: 5 }) {
  return renderHook(() => usePresentationNav(options))
}

const press = (key: string, target: Element | Document = document.body) =>
  act(() => {
    fireEvent.keyDown(target, { key })
  })

describe('keyboard navigation', () => {
  it.each(['ArrowRight', ' ', 'PageDown'])('%j advances exactly one step', (key) => {
    const { result } = setup({ count: 5, initialIndex: 2 })
    press(key)
    expect(result.current.index).toBe(3)
  })

  it.each(['ArrowLeft', 'PageUp'])('%s goes back exactly one step', (key) => {
    const { result } = setup({ count: 5, initialIndex: 2 })
    press(key)
    expect(result.current.index).toBe(1)
  })

  it('ignores unrelated keys and modified shortcuts', () => {
    const { result } = setup({ count: 5, initialIndex: 2 })
    press('a')
    act(() => {
      fireEvent.keyDown(document.body, { key: 'ArrowRight', ctrlKey: true })
    })
    expect(result.current.index).toBe(2)
  })

  it('exposes next, prev and goTo for on-screen controls', () => {
    const { result } = setup({ count: 5, initialIndex: 2 })
    act(() => result.current.next())
    expect(result.current.index).toBe(3)
    act(() => result.current.prev())
    act(() => result.current.prev())
    expect(result.current.index).toBe(1)
    act(() => result.current.goTo(4))
    expect(result.current.index).toBe(4)
  })
})

describe('boundaries', () => {
  it('stays on the first step when going back, by key and by action', () => {
    const { result } = setup()
    press('ArrowLeft')
    press('PageUp')
    act(() => result.current.prev())
    expect(result.current.index).toBe(0)
  })

  it('stays on the last step when advancing, by key, action and swipe', () => {
    const { result } = setup({ count: 3, initialIndex: 2 })
    press('ArrowRight')
    press(' ')
    act(() => result.current.next())
    swipe(300, 0, 100, 0)
    expect(result.current.index).toBe(2)
  })

  it('clamps direct jumps', () => {
    const { result } = setup()
    act(() => result.current.goTo(99))
    expect(result.current.index).toBe(4)
    act(() => result.current.goTo(-3))
    expect(result.current.index).toBe(0)
  })

  it('re-clamps when the step count shrinks', () => {
    const { result, rerender } = renderHook((p: { count: number }) => usePresentationNav({ ...p, initialIndex: 4 }), {
      initialProps: { count: 5 },
    })
    rerender({ count: 2 })
    expect(result.current.index).toBe(1)
  })
})

function swipe(x1: number, y1: number, x2: number, y2: number) {
  act(() => {
    fireEvent.touchStart(window, { changedTouches: [{ clientX: x1, clientY: y1 }] })
    fireEvent.touchEnd(window, { changedTouches: [{ clientX: x2, clientY: y2 }] })
  })
}

describe('touch swipe', () => {
  it('classifies direction, dominance and threshold', () => {
    expect(classifySwipe(-SWIPE_MIN_PX - 1, 0)).toBe('next')
    expect(classifySwipe(SWIPE_MIN_PX + 1, 0)).toBe('prev')
    expect(classifySwipe(-(SWIPE_MIN_PX - 1), 0)).toBeNull()
    expect(classifySwipe(-100, 120)).toBeNull()
    expect(classifySwipe(0, 200)).toBeNull()
  })

  it('wires left swipes to next and right swipes to previous', () => {
    const { result } = setup({ count: 5, initialIndex: 2 })
    swipe(300, 100, 100, 110)
    expect(result.current.index).toBe(3)
    swipe(100, 100, 300, 90)
    expect(result.current.index).toBe(2)
  })

  it('ignores vertical and tiny gestures', () => {
    const { result } = setup({ count: 5, initialIndex: 2 })
    swipe(100, 100, 110, 400)
    swipe(100, 100, 120, 100)
    expect(result.current.index).toBe(2)
  })
})

describe('controls keep their keys', () => {
  function appendControl(tag: string, attrs: Record<string, string> = {}) {
    const el = document.createElement(tag)
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v)
    const inner = document.createElement('span')
    el.append(inner)
    document.body.append(el)
    return { el, inner }
  }

  it.each([
    ['button', {}],
    ['a', { href: '#x' }],
    ['input', {}],
    ['textarea', {}],
    ['select', {}],
    ['summary', {}],
    ['div', { contenteditable: 'true' }],
    ['div', { role: 'slider' }],
  ])('does not navigate for keys inside <%s %j>', (tag, attrs) => {
    const { result } = setup({ count: 5, initialIndex: 2 })
    const { el, inner } = appendControl(tag, attrs)
    for (const target of [el, inner]) {
      press('ArrowRight', target)
      press(' ', target)
      press('p', target)
    }
    expect(result.current.index).toBe(2)
    expect(result.current.mode).toBe('browse')
    el.remove()
  })

  it('does not call preventDefault on keys a control owns', () => {
    setup()
    const { el } = appendControl('button')
    const event = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true })
    el.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(false)
    el.remove()
  })

  it('still navigates for the same keys on the page body', () => {
    const { result } = setup({ count: 5, initialIndex: 2 })
    press('ArrowRight')
    expect(result.current.index).toBe(3)
  })
})

describe('modes', () => {
  it.each(['present', 'browse'] as const)('honors the declared initial mode %s', (initialMode) => {
    expect(setup({ count: 5, initialMode }).result.current.mode).toBe(initialMode)
  })

  it('defaults to browse', () => {
    expect(setup().result.current.mode).toBe('browse')
  })

  it('toggles with P in both directions and keeps the step', () => {
    const { result } = setup({ count: 5, initialIndex: 3 })
    press('p')
    expect(result.current.mode).toBe('present')
    press('P')
    expect(result.current.mode).toBe('browse')
    expect(result.current.index).toBe(3)
  })

  it('exposes setMode and toggleMode', () => {
    const { result } = setup({ count: 5, initialIndex: 3 })
    act(() => result.current.setMode('present'))
    expect(result.current.mode).toBe('present')
    act(() => result.current.toggleMode())
    expect(result.current.mode).toBe('browse')
    expect(result.current.index).toBe(3)
  })
})

describe('keyToAction', () => {
  it('maps the documented keys', () => {
    expect(keyToAction('ArrowRight')).toBe('next')
    expect(keyToAction('PageUp')).toBe('prev')
    expect(keyToAction('P')).toBe('toggle-mode')
    expect(keyToAction('x')).toBeNull()
  })
})

describe('StrictMode and listener cleanup', () => {
  it('handles one key press once under StrictMode double-invocation', () => {
    const { result } = renderHook(() => usePresentationNav({ count: 5 }), { wrapper: StrictMode })
    press('ArrowRight')
    expect(result.current.index).toBe(1)
  })

  it('removes its listeners on unmount', () => {
    const add = vi.spyOn(window, 'addEventListener')
    const remove = vi.spyOn(window, 'removeEventListener')
    const { unmount } = setup()
    const added = add.mock.calls.map(([type]) => type)
    unmount()
    const removed = remove.mock.calls.map(([type]) => type)
    for (const type of ['keydown', 'touchstart', 'touchend']) {
      expect(added).toContain(type)
      expect(removed).toContain(type)
    }
    add.mockRestore()
    remove.mockRestore()
  })

  it('lets only the current instance respond after a remount', () => {
    const first = setup({ count: 5 })
    first.unmount()
    const second = setup({ count: 5 })
    press('ArrowRight')
    expect(first.result.current.index).toBe(0)
    expect(second.result.current.index).toBe(1)
  })
})
