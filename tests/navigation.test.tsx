import { act, fireEvent, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { usePresentationNav } from '../src/presentation-kit/usePresentationNav'

function key(key: string, target: EventTarget = window) {
  fireEvent.keyDown(target, { key })
}

describe('presentation navigation', () => {
  it('maps keyboard commands, clamps boundaries, and preserves position across modes', () => {
    const { result } = renderHook(() => usePresentationNav(3, 'browse'))
    key('ArrowLeft'); expect(result.current.index).toBe(0)
    for (const command of ['ArrowRight', ' ', 'PageDown']) key(command)
    expect(result.current.index).toBe(2)
    key('P'); expect(result.current.mode).toBe('present')
    expect(result.current.index).toBe(2)
    key('PageUp'); key('ArrowLeft'); expect(result.current.index).toBe(0)
    act(() => result.current.jump(99)); expect(result.current.index).toBe(2)
    act(() => result.current.jump(-10)); expect(result.current.index).toBe(0)
  })

  it.each(['button', 'a', 'input', 'textarea', 'select', '[contenteditable]'])('leaves keys on %s alone', (tag) => {
    const { result } = renderHook(() => usePresentationNav(3))
    const control = document.createElement(tag === '[contenteditable]' ? 'div' : tag)
    if (tag === '[contenteditable]') control.setAttribute('contenteditable', 'true')
    if (tag === 'a') control.setAttribute('href', '#')
    const child = document.createElement('span')
    control.appendChild(child); document.body.appendChild(control)
    key('ArrowRight', child); key('P', child)
    expect(result.current.index).toBe(0)
    expect(result.current.mode).toBe('browse')
    control.remove()
  })

  it('ignores modified shortcuts and cleans up keyboard listeners', () => {
    const { result, unmount } = renderHook(() => usePresentationNav(3))
    fireEvent.keyDown(window, { key: 'ArrowRight', ctrlKey: true })
    expect(result.current.index).toBe(0)
    unmount()
    const event = new KeyboardEvent('keydown', { key: 'ArrowRight', cancelable: true })
    window.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(false)
  })

  it('handles horizontal swipes without treating vertical movement or taps as navigation', () => {
    const { result } = renderHook(() => usePresentationNav(3))
    const swipe = (x: number, y: number) => {
      act(() => result.current.touchHandlers.onTouchStart({ touches: [{ clientX: 100, clientY: 100 }] } as unknown as React.TouchEvent))
      act(() => result.current.touchHandlers.onTouchEnd({ changedTouches: [{ clientX: x, clientY: y }] } as unknown as React.TouchEvent))
    }
    swipe(20, 105); expect(result.current.index).toBe(1)
    swipe(180, 105); expect(result.current.index).toBe(0)
    swipe(80, 105); swipe(20, 300); expect(result.current.index).toBe(0)
  })

  it('honors initial mode and clamps when the step list shrinks', () => {
    const { result, rerender } = renderHook(({ count }) => usePresentationNav(count, 'present'), { initialProps: { count: 4 } })
    act(() => result.current.jump(3)); rerender({ count: 2 })
    expect(result.current.index).toBe(1)
    expect(result.current.mode).toBe('present')
  })
})
