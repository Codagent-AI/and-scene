import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { usePresentationNav } from './usePresentationNav'

describe('usePresentationNav', () => {
  afterEach(() => vi.restoreAllMocks())

  it('maps navigation keys, toggles mode, and clamps at boundaries', () => {
    const { result } = renderHook(() => usePresentationNav(3))
    act(() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true })))
    expect(result.current.index).toBe(0)
    act(() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })))
    expect(result.current.index).toBe(1)
    act(() => window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true })))
    act(() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'PageDown', bubbles: true })))
    expect(result.current.index).toBe(2)
    act(() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })))
    expect(result.current.index).toBe(2)
    act(() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'p', bubbles: true })))
    expect(result.current.mode).toBe('present')
  })

  it('ignores deck keys from interactive controls and preserves position on mode toggle', () => {
    const { result } = renderHook(() => usePresentationNav(4, 'present'))
    act(() => result.current.goTo(2))
    const button = document.createElement('button')
    document.body.append(button)
    button.focus()
    act(() => button.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })))
    expect(result.current.index).toBe(2)
    act(() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'p', bubbles: true })))
    expect(result.current.index).toBe(2)
    expect(result.current.mode).toBe('browse')
    button.remove()
  })

  it('uses horizontal swipes only', () => {
    const { result } = renderHook(() => usePresentationNav(3))
    const stage = document.createElement('div')
    act(() => result.current.bindSwipe(stage))
    act(() => {
      stage.dispatchEvent(new TouchEvent('touchstart', { touches: [{ clientX: 200, clientY: 20 } as Touch] }))
      stage.dispatchEvent(new TouchEvent('touchend', { changedTouches: [{ clientX: 80, clientY: 22 } as Touch] }))
    })
    expect(result.current.index).toBe(1)
    act(() => {
      stage.dispatchEvent(new TouchEvent('touchstart', { touches: [{ clientX: 50, clientY: 20 } as Touch] }))
      stage.dispatchEvent(new TouchEvent('touchend', { changedTouches: [{ clientX: 190, clientY: 23 } as Touch] }))
    })
    expect(result.current.index).toBe(0)
  })
})
