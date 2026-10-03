import { describe, expect, it } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import type { TouchEvent as ReactTouchEvent } from 'react'
import { usePresentationNav } from '../usePresentationNav'

function touchEvent(clientX: number, phase: 'start' | 'end'): ReactTouchEvent {
  const point = { clientX } as Touch
  return {
    touches: phase === 'start' ? [point] : [],
    changedTouches: phase === 'end' ? [point] : [],
  } as unknown as ReactTouchEvent
}

describe('navigation boundaries', () => {
  it('clamps at the start with no wrap-around', () => {
    const { result } = renderHook(() => usePresentationNav({ stepCount: 3 }))
    act(() => result.current.prev())
    expect(result.current.stepIndex).toBe(0)
    expect(result.current.atStart).toBe(true)
  })

  it('clamps at the end with no wrap-around', () => {
    const { result } = renderHook(() => usePresentationNav({ stepCount: 3 }))
    act(() => result.current.next())
    act(() => result.current.next())
    act(() => result.current.next())
    expect(result.current.stepIndex).toBe(2)
    expect(result.current.atEnd).toBe(true)
  })

  it('supports direct jumps within range', () => {
    const { result } = renderHook(() => usePresentationNav({ stepCount: 5 }))
    act(() => result.current.goTo(3))
    expect(result.current.stepIndex).toBe(3)
    act(() => result.current.goTo(99))
    expect(result.current.stepIndex).toBe(4)
  })

  it('advances on ArrowRight/Space/PageDown and retreats on ArrowLeft/PageUp', () => {
    const { result } = renderHook(() => usePresentationNav({ stepCount: 4 }))
    act(() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' })))
    expect(result.current.stepIndex).toBe(1)
    act(() => window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' })))
    expect(result.current.stepIndex).toBe(2)
    act(() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'PageDown' })))
    expect(result.current.stepIndex).toBe(3)
    act(() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' })))
    expect(result.current.stepIndex).toBe(2)
    act(() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'PageUp' })))
    expect(result.current.stepIndex).toBe(1)
  })

  it('toggles mode on P', () => {
    const { result } = renderHook(() => usePresentationNav({ stepCount: 3 }))
    expect(result.current.mode).toBe('browse')
    act(() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'P' })))
    expect(result.current.mode).toBe('present')
  })

  it('leaves navigation keys to a focused form control', () => {
    const input = document.createElement('input')
    document.body.appendChild(input)
    input.focus()

    const { result } = renderHook(() => usePresentationNav({ stepCount: 3 }))
    act(() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' })))
    expect(result.current.stepIndex).toBe(0)

    input.remove()
  })

  it.each(['slider', 'spinbutton', 'tab', 'listbox', 'combobox', 'radio', 'checkbox', 'switch', 'menuitem'])(
    'leaves navigation keys to a focused custom %s widget',
    (role) => {
      const widget = document.createElement('div')
      widget.setAttribute('role', role)
      widget.tabIndex = 0
      document.body.appendChild(widget)
      widget.focus()

      const { result } = renderHook(() => usePresentationNav({ stepCount: 3 }))
      act(() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' })))
      act(() => window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' })))
      expect(result.current.stepIndex).toBe(0)

      widget.remove()
    },
  )

  it('advances on a left swipe and retreats on a right swipe', () => {
    const { result } = renderHook(() => usePresentationNav({ stepCount: 3 }))
    act(() => {
      result.current.swipeHandlers.onTouchStart(touchEvent(200, 'start'))
      result.current.swipeHandlers.onTouchEnd(touchEvent(100, 'end'))
    })
    expect(result.current.stepIndex).toBe(1)

    act(() => {
      result.current.swipeHandlers.onTouchStart(touchEvent(100, 'start'))
      result.current.swipeHandlers.onTouchEnd(touchEvent(200, 'end'))
    })
    expect(result.current.stepIndex).toBe(0)
  })
})
