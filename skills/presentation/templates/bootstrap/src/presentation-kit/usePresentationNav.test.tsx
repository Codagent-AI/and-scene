import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { usePresentationNav } from './usePresentationNav'

function fireKey(key: string, target: EventTarget = window) {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true })
  target.dispatchEvent(event)
}

describe('usePresentationNav', () => {
  it('starts on step 0 in the requested initial mode', () => {
    const { result } = renderHook(() => usePresentationNav({ stepCount: 5, initialMode: 'present' }))
    expect(result.current.index).toBe(0)
    expect(result.current.mode).toBe('present')
  })

  it('defaults to browse mode when no initial mode is given', () => {
    const { result } = renderHook(() => usePresentationNav({ stepCount: 5 }))
    expect(result.current.mode).toBe('browse')
  })

  it('next()/prev() move one step and clamp at both ends', () => {
    const { result } = renderHook(() => usePresentationNav({ stepCount: 3 }))

    act(() => result.current.prev())
    expect(result.current.index).toBe(0)

    act(() => result.current.next())
    act(() => result.current.next())
    expect(result.current.index).toBe(2)

    act(() => result.current.next())
    expect(result.current.index).toBe(2)
  })

  it('goTo() jumps directly to a step, clamped to range', () => {
    const { result } = renderHook(() => usePresentationNav({ stepCount: 5 }))
    act(() => result.current.goTo(3))
    expect(result.current.index).toBe(3)
    act(() => result.current.goTo(99))
    expect(result.current.index).toBe(4)
    act(() => result.current.goTo(-5))
    expect(result.current.index).toBe(0)
  })

  it('ArrowRight, Space, and PageDown advance one step', () => {
    const { result } = renderHook(() => usePresentationNav({ stepCount: 5 }))
    act(() => fireKey('ArrowRight'))
    expect(result.current.index).toBe(1)
    act(() => fireKey(' '))
    expect(result.current.index).toBe(2)
    act(() => fireKey('PageDown'))
    expect(result.current.index).toBe(3)
  })

  it('ArrowLeft and PageUp go back one step', () => {
    const { result } = renderHook(() => usePresentationNav({ stepCount: 5 }))
    act(() => result.current.goTo(3))
    act(() => fireKey('ArrowLeft'))
    expect(result.current.index).toBe(2)
    act(() => fireKey('PageUp'))
    expect(result.current.index).toBe(1)
  })

  it('P toggles between browse and present mode', () => {
    const { result } = renderHook(() => usePresentationNav({ stepCount: 5, initialMode: 'browse' }))
    act(() => fireKey('p'))
    expect(result.current.mode).toBe('present')
    act(() => fireKey('p'))
    expect(result.current.mode).toBe('browse')
  })

  it('toggling mode preserves the current step', () => {
    const { result } = renderHook(() => usePresentationNav({ stepCount: 5 }))
    act(() => result.current.goTo(2))
    act(() => result.current.toggleMode())
    expect(result.current.index).toBe(2)
  })

  it('does not advance the deck when a focused control has the key', () => {
    const button = document.createElement('button')
    document.body.appendChild(button)
    button.focus()

    const { result } = renderHook(() => usePresentationNav({ stepCount: 5 }))
    act(() => fireKey('ArrowRight', button))
    expect(result.current.index).toBe(0)

    document.body.removeChild(button)
  })

  it('a horizontal swipe left on the stage advances, swipe right goes back', () => {
    const { result } = renderHook(() => usePresentationNav({ stepCount: 5 }))
    act(() => result.current.goTo(2))

    const node = document.createElement('div')
    document.body.appendChild(node)
    act(() => {
      result.current.stageRef(node)
    })

    act(() => {
      node.dispatchEvent(
        new TouchEvent('touchstart', { touches: [{ clientX: 200 } as Touch] }),
      )
      node.dispatchEvent(
        new TouchEvent('touchend', { changedTouches: [{ clientX: 100 } as Touch] }),
      )
    })
    expect(result.current.index).toBe(3)

    act(() => {
      node.dispatchEvent(
        new TouchEvent('touchstart', { touches: [{ clientX: 100 } as Touch] }),
      )
      node.dispatchEvent(
        new TouchEvent('touchend', { changedTouches: [{ clientX: 200 } as Touch] }),
      )
    })
    expect(result.current.index).toBe(2)

    document.body.removeChild(node)
  })
})
