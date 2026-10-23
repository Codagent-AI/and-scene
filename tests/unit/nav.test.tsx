// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, renderHook, act } from '@testing-library/react'
import { clampIndex, swipeDirection, usePresentationNav } from '../../src/presentation-kit/usePresentationNav'
import { SWIPE_MIN_PX } from '../../src/presentation-kit/constants'

afterEach(() => {
  vi.restoreAllMocks()
})

function dispatchTouch(type: 'touchstart' | 'touchend', clientX: number, clientY: number) {
  const event = new Event(type)
  Object.defineProperty(event, 'changedTouches', { value: [{ clientX, clientY }] })
  act(() => {
    window.dispatchEvent(event)
  })
}

function swipe(dx: number, dy = 0) {
  dispatchTouch('touchstart', 300, 300)
  dispatchTouch('touchend', 300 + dx, 300 + dy)
}

describe('usePresentationNav keyboard', () => {
  it.each([
    ['ArrowRight', 1],
    [' ', 1],
    ['PageDown', 1],
    ['ArrowLeft', -1],
    ['PageUp', -1],
  ])('key %j from a middle index moves exactly one step (%i)', (key, delta) => {
    const { result } = renderHook(() => usePresentationNav(9))
    act(() => result.current.goTo(4))
    fireEvent.keyDown(window, { key })
    expect(result.current.index).toBe(4 + delta)
  })

  it('P toggles the mode in both directions without moving the step', () => {
    const { result } = renderHook(() => usePresentationNav(9, 'browse'))
    act(() => result.current.goTo(4))
    fireEvent.keyDown(window, { key: 'p' })
    expect(result.current.mode).toBe('present')
    expect(result.current.index).toBe(4)
    fireEvent.keyDown(window, { key: 'P' })
    expect(result.current.mode).toBe('browse')
    expect(result.current.index).toBe(4)
  })

  it('handled navigation keys prevent the browser default; unhandled keys do not', () => {
    renderHook(() => usePresentationNav(9))
    const handled = new KeyboardEvent('keydown', { key: 'ArrowRight', cancelable: true })
    act(() => {
      window.dispatchEvent(handled)
    })
    expect(handled.defaultPrevented).toBe(true)
    const unhandled = new KeyboardEvent('keydown', { key: 'x', cancelable: true })
    act(() => {
      window.dispatchEvent(unhandled)
    })
    expect(unhandled.defaultPrevented).toBe(false)
  })

  it('a modifier key does not navigate', () => {
    const { result } = renderHook(() => usePresentationNav(9))
    fireEvent.keyDown(window, { key: 'ArrowRight', ctrlKey: true })
    expect(result.current.index).toBe(0)
  })

  it.each([
    ['button', ''],
    ['a', '#x'],
    ['input', ''],
    ['select', ''],
    ['textarea', ''],
    ['summary', ''],
  ])('focused %s keeps every navigation key: no move, no mode change, no default prevented', (tag, href) => {
    const { result } = renderHook(() => usePresentationNav(9))
    act(() => result.current.goTo(4))
    const element = document.createElement(tag)
    if (href) element.setAttribute('href', href)
    document.body.appendChild(element)
    for (const key of ['ArrowRight', ' ', 'PageDown', 'ArrowLeft', 'PageUp', 'p', 'P']) {
      const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true })
      act(() => {
        element.dispatchEvent(event)
      })
      expect(event.defaultPrevented, `${tag} ${key}`).toBe(false)
      expect(result.current.index, `${tag} ${key}`).toBe(4)
      expect(result.current.mode, `${tag} ${key}`).toBe('browse')
    }
    element.remove()
  })

  it('keys inside a contenteditable descendant keep their keys', () => {
    const { result } = renderHook(() => usePresentationNav(9))
    const host = document.createElement('div')
    host.setAttribute('contenteditable', 'true')
    const child = document.createElement('span')
    host.appendChild(child)
    document.body.appendChild(host)
    fireEvent.keyDown(child, { key: 'PageDown' })
    expect(result.current.index).toBe(0)
    host.remove()
  })

  it('the same key on the document body still navigates', () => {
    const { result } = renderHook(() => usePresentationNav(9))
    render(<div />)
    fireEvent.keyDown(document.body, { key: 'ArrowRight' })
    expect(result.current.index).toBe(1)
  })
})

describe('usePresentationNav clamping', () => {
  it('clamps at the first step: going back stays on 0', () => {
    const { result } = renderHook(() => usePresentationNav(4))
    fireEvent.keyDown(window, { key: 'ArrowLeft' })
    act(() => result.current.prev())
    expect(result.current.index).toBe(0)
  })

  it('clamps at the last step: advancing stays on the last index, no wrap', () => {
    const { result } = renderHook(() => usePresentationNav(4))
    act(() => result.current.goTo(3))
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    act(() => result.current.next())
    expect(result.current.index).toBe(3)
    expect(clampIndex(99, 4)).toBe(3)
    expect(clampIndex(-5, 4)).toBe(0)
  })

  it('swipes that overshoot either end do not wrap', () => {
    const { result } = renderHook(() => usePresentationNav(3))
    swipe(-200)
    swipe(-200)
    swipe(-200)
    expect(result.current.index).toBe(2)
    swipe(200)
    swipe(200)
    swipe(200)
    swipe(200)
    expect(result.current.index).toBe(0)
  })
})

describe('usePresentationNav touch swipe', () => {
  it('left advances and right goes back', () => {
    const { result } = renderHook(() => usePresentationNav(9))
    act(() => result.current.goTo(4))
    swipe(-120)
    expect(result.current.index).toBe(5)
    swipe(120)
    expect(result.current.index).toBe(4)
  })

  it('a short gesture, or one that is mostly vertical, does nothing', () => {
    const { result } = renderHook(() => usePresentationNav(9))
    act(() => result.current.goTo(4))
    swipe(-(SWIPE_MIN_PX - 1))
    expect(result.current.index).toBe(4)
    swipe(-100, 200)
    expect(result.current.index).toBe(4)
  })

  it('applies the displacement threshold at exactly SWIPE_MIN_PX', () => {
    expect(swipeDirection(-SWIPE_MIN_PX, 0)).toBe(1)
    expect(swipeDirection(-(SWIPE_MIN_PX - 1), 0)).toBe(0)
    expect(swipeDirection(100, 100)).toBe(0)
    expect(swipeDirection(100, 99)).toBe(-1)
  })
})

describe('usePresentationNav mode', () => {
  it('toggles mode while keeping the current step', () => {
    const { result } = renderHook(() => usePresentationNav(9))
    act(() => result.current.goTo(4))
    act(() => result.current.toggleMode())
    expect(result.current.mode).toBe('present')
    expect(result.current.index).toBe(4)
  })

  it('starts in browse mode by default, and honors an explicit initial mode', () => {
    expect(renderHook(() => usePresentationNav(3)).result.current.mode).toBe('browse')
    expect(renderHook(() => usePresentationNav(3, 'present')).result.current.mode).toBe('present')
  })
})
