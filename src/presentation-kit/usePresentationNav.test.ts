import { describe, expect, it } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { usePresentationNav } from './usePresentationNav'

function pressKey(key: string, target: EventTarget = window) {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true })
  target.dispatchEvent(event)
}

describe('usePresentationNav', () => {
  it('starts on the first step in present mode by default', () => {
    const { result } = renderHook(() => usePresentationNav(5))
    expect(result.current.index).toBe(0)
    expect(result.current.mode).toBe('present')
  })

  it('advances one step on ArrowRight, Space, or PageDown', () => {
    const { result } = renderHook(() => usePresentationNav(5))
    act(() => pressKey('ArrowRight'))
    expect(result.current.index).toBe(1)
    act(() => pressKey(' '))
    expect(result.current.index).toBe(2)
    act(() => pressKey('PageDown'))
    expect(result.current.index).toBe(3)
  })

  it('goes back one step on ArrowLeft or PageUp', () => {
    const { result } = renderHook(() => usePresentationNav(5))
    act(() => {
      result.current.goTo(3)
    })
    act(() => pressKey('ArrowLeft'))
    expect(result.current.index).toBe(2)
    act(() => pressKey('PageUp'))
    expect(result.current.index).toBe(1)
  })

  it('clamps at the first step when going back further', () => {
    const { result } = renderHook(() => usePresentationNav(5))
    act(() => pressKey('ArrowLeft'))
    expect(result.current.index).toBe(0)
  })

  it('clamps at the last step when advancing further', () => {
    const { result } = renderHook(() => usePresentationNav(3))
    act(() => {
      result.current.goTo(2)
    })
    act(() => pressKey('ArrowRight'))
    expect(result.current.index).toBe(2)
  })

  it('toggles mode on P and preserves the current step', () => {
    const { result } = renderHook(() => usePresentationNav(5))
    act(() => {
      result.current.goTo(2)
    })
    act(() => pressKey('p'))
    expect(result.current.mode).toBe('browse')
    expect(result.current.index).toBe(2)
    act(() => pressKey('p'))
    expect(result.current.mode).toBe('present')
    expect(result.current.index).toBe(2)
  })

  it('does not steal navigation keys when focus is on an interactive control', () => {
    const input = document.createElement('input')
    document.body.appendChild(input)
    const { result } = renderHook(() => usePresentationNav(5))
    act(() => pressKey('ArrowRight', input))
    expect(result.current.index).toBe(0)
    document.body.removeChild(input)
  })

  it('advances on a leftward swipe and goes back on a rightward swipe', () => {
    const { result } = renderHook(() => usePresentationNav(5))
    act(() => {
      result.current.handleTouchStart({ touches: [{ clientX: 300 }] } as unknown as React.TouchEvent)
      result.current.handleTouchEnd({ changedTouches: [{ clientX: 100 }] } as unknown as React.TouchEvent)
    })
    expect(result.current.index).toBe(1)
    act(() => {
      result.current.handleTouchStart({ touches: [{ clientX: 100 }] } as unknown as React.TouchEvent)
      result.current.handleTouchEnd({ changedTouches: [{ clientX: 300 }] } as unknown as React.TouchEvent)
    })
    expect(result.current.index).toBe(0)
  })

  it('jumps directly to a step via goTo, clamped to bounds', () => {
    const { result } = renderHook(() => usePresentationNav(5))
    act(() => {
      result.current.goTo(4)
    })
    expect(result.current.index).toBe(4)
    act(() => {
      result.current.goTo(99)
    })
    expect(result.current.index).toBe(4)
    act(() => {
      result.current.goTo(-5)
    })
    expect(result.current.index).toBe(0)
  })

  it('clamps the reported index when the step count shrinks past it', () => {
    const { result, rerender } = renderHook(({ count }) => usePresentationNav(count), {
      initialProps: { count: 5 },
    })
    act(() => {
      result.current.goTo(4)
    })
    expect(result.current.index).toBe(4)

    rerender({ count: 2 })
    expect(result.current.index).toBe(1)
  })
})
