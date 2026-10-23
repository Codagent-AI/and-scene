import { act, fireEvent, render, renderHook } from '@testing-library/react'
import { StrictMode } from 'react'
import { describe, expect, it } from 'vitest'
import { classifySwipe, clampIndex, firstIndexOfEra, isInteractiveTarget } from '../../src/presentation-kit/nav.ts'
import { usePresentationNav } from '../../src/presentation-kit/usePresentationNav.ts'

const key = (k: string, target: Element | Window | Document = window) =>
  act(() => {
    fireEvent.keyDown(target, { key: k })
  })

const swipe = (dx: number, dy: number) => {
  act(() => {
    fireEvent.touchStart(window, { changedTouches: [{ clientX: 200, clientY: 200 }] })
    fireEvent.touchEnd(window, { changedTouches: [{ clientX: 200 + dx, clientY: 200 + dy }] })
  })
}

describe('usePresentationNav', () => {
  it('advances one step on Right, Space and PageDown, and goes back on Left and PageUp', () => {
    const { result } = renderHook(() => usePresentationNav(6))
    for (const k of ['ArrowRight', ' ', 'PageDown']) {
      const before = result.current.index
      key(k)
      expect(result.current.index).toBe(before + 1)
    }
    expect(result.current.index).toBe(3)
    key('ArrowLeft')
    expect(result.current.index).toBe(2)
    key('PageUp')
    expect(result.current.index).toBe(1)
  })

  it('toggles the mode with P in both directions and keeps the step', () => {
    const { result } = renderHook(() => usePresentationNav(6, 'browse'))
    key('ArrowRight')
    key('ArrowRight')
    key('p')
    expect(result.current.mode).toBe('present')
    expect(result.current.index).toBe(2)
    key('P')
    expect(result.current.mode).toBe('browse')
    expect(result.current.index).toBe(2)
  })

  it('opens in the declared initial mode', () => {
    expect(renderHook(() => usePresentationNav(3, 'present')).result.current.mode).toBe('present')
    expect(renderHook(() => usePresentationNav(3, 'browse')).result.current.mode).toBe('browse')
  })

  it('swipes left to advance and right to go back, one step per gesture', () => {
    const { result } = renderHook(() => usePresentationNav(6))
    swipe(-120, 5)
    expect(result.current.index).toBe(1)
    swipe(-120, 5)
    expect(result.current.index).toBe(2)
    swipe(120, 5)
    expect(result.current.index).toBe(1)
  })

  it('ignores short swipes, vertical-dominant swipes, and a touchend without a start', () => {
    const { result } = renderHook(() => usePresentationNav(6))
    swipe(-49, 0)
    swipe(-80, 120)
    swipe(-60, 60)
    act(() => {
      fireEvent.touchEnd(window, { changedTouches: [{ clientX: 0, clientY: 0 }] })
    })
    expect(result.current.index).toBe(0)
    swipe(-50, 10)
    expect(result.current.index).toBe(1)
  })

  it('clamps at both ends for keys, swipes, next/prev and out-of-range jumps', () => {
    const { result } = renderHook(() => usePresentationNav(3))
    key('ArrowLeft')
    swipe(120, 0)
    act(() => result.current.prev())
    act(() => result.current.goTo(-5))
    expect(result.current.index).toBe(0)
    act(() => result.current.goTo(99))
    expect(result.current.index).toBe(2)
    key('ArrowRight')
    key('PageDown')
    swipe(-120, 0)
    act(() => result.current.next())
    expect(result.current.index).toBe(2)
    act(() => result.current.goTo(1))
    expect(result.current.index).toBe(1)
  })

  it('leaves navigation keys to focused interactive controls', () => {
    const { result } = renderHook(() => usePresentationNav(6))
    const controls = [
      document.createElement('button'),
      Object.assign(document.createElement('a'), { href: '/x' }),
      document.createElement('input'),
      document.createElement('select'),
      document.createElement('textarea'),
      (() => {
        const d = document.createElement('div')
        d.setAttribute('contenteditable', 'true')
        return d
      })(),
    ]
    const nested = document.createElement('button')
    const inner = document.createElement('span')
    nested.append(inner)
    for (const el of [...controls, nested]) document.body.append(el)
    for (const el of [...controls, inner]) {
      for (const k of ['ArrowRight', ' ', 'PageDown', 'ArrowLeft', 'p']) {
        const ev = new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true })
        act(() => {
          el.dispatchEvent(ev)
        })
        expect(ev.defaultPrevented).toBe(false)
      }
    }
    expect(result.current.index).toBe(0)
    expect(result.current.mode).toBe('browse')
    // a non-interactive target still navigates
    key('ArrowRight', document.body)
    expect(result.current.index).toBe(1)
  })

  it('ignores modified keys', () => {
    const { result } = renderHook(() => usePresentationNav(6))
    act(() => {
      fireEvent.keyDown(window, { key: 'ArrowRight', ctrlKey: true })
    })
    expect(result.current.index).toBe(0)
  })

  it('registers each listener once, even under StrictMode, and removes them on unmount', () => {
    const added: string[] = []
    const removed: string[] = []
    const add = window.addEventListener.bind(window)
    const rem = window.removeEventListener.bind(window)
    window.addEventListener = ((t: string, ...a: unknown[]) => {
      added.push(t)
      return (add as (...x: unknown[]) => void)(t, ...a)
    }) as typeof window.addEventListener
    window.removeEventListener = ((t: string, ...a: unknown[]) => {
      removed.push(t)
      return (rem as (...x: unknown[]) => void)(t, ...a)
    }) as typeof window.removeEventListener
    try {
      const { result, unmount } = renderHook(() => usePresentationNav(6), { wrapper: StrictMode })
      key('ArrowRight')
      expect(result.current.index).toBe(1) // one press, one step: no double handling
      unmount()
      for (const t of ['keydown', 'touchstart', 'touchend']) {
        expect(removed.filter((x) => x === t).length).toBe(added.filter((x) => x === t).length)
      }
      const before = result.current.index
      key('ArrowRight')
      expect(result.current.index).toBe(before)
    } finally {
      window.addEventListener = add
      window.removeEventListener = rem
    }
  })

  it('does not re-register listeners when the component re-renders', () => {
    let adds = 0
    const add = window.addEventListener.bind(window)
    window.addEventListener = ((t: string, ...a: unknown[]) => {
      if (t === 'keydown') adds++
      return (add as (...x: unknown[]) => void)(t, ...a)
    }) as typeof window.addEventListener
    try {
      const { rerender } = render(<Probe />)
      const first = adds
      rerender(<Probe />)
      expect(adds).toBe(first)
    } finally {
      window.addEventListener = add
    }
  })
})

function Probe() {
  usePresentationNav(4)
  return null
}

describe('nav helpers', () => {
  it('clampIndex bounds to [0, count-1] and tolerates an empty list', () => {
    expect(clampIndex(-1, 4)).toBe(0)
    expect(clampIndex(9, 4)).toBe(3)
    expect(clampIndex(2, 4)).toBe(2)
    expect(clampIndex(3, 0)).toBe(0)
  })
  it('classifySwipe respects the threshold and horizontal dominance', () => {
    expect(classifySwipe(-50, 0, 50)).toBe('next')
    expect(classifySwipe(50, 0, 50)).toBe('prev')
    expect(classifySwipe(-49, 0, 50)).toBeNull()
    expect(classifySwipe(60, 60, 50)).toBeNull()
  })
  it('firstIndexOfEra returns the first occurrence, not the current step', () => {
    expect(firstIndexOfEra(['a', 'a', 'b', 'b'], 'b')).toBe(2)
  })
  it('isInteractiveTarget is false for non-elements', () => {
    expect(isInteractiveTarget(null)).toBe(false)
    expect(isInteractiveTarget(window)).toBe(false)
  })
})
