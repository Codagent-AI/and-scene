// @vitest-environment jsdom
import { act, fireEvent, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { actionForKey, clampIndex, isInteractiveTarget, swipeAction, usePresentationNav } from '../usePresentationNav.ts'

const press = (key: string, target: Window | Element = window) =>
  act(() => {
    fireEvent.keyDown(target, { key })
  })

describe('key and swipe mapping', () => {
  it('maps Right/Space/PageDown to next and Left/PageUp to prev', () => {
    for (const k of ['ArrowRight', ' ', 'PageDown']) expect(actionForKey(k)).toBe('next')
    for (const k of ['ArrowLeft', 'PageUp']) expect(actionForKey(k)).toBe('prev')
    expect(actionForKey('p')).toBe('toggle-mode')
    expect(actionForKey('x')).toBeUndefined()
  })

  it('swipes left to advance and right to go back, ignoring short or vertical drags', () => {
    expect(swipeAction(-120, 5)).toBe('next')
    expect(swipeAction(120, 5)).toBe('prev')
    expect(swipeAction(-20, 0)).toBeUndefined()
    expect(swipeAction(-80, 90)).toBeUndefined()
  })

  it('clamps indexes to [0, last]', () => {
    expect(clampIndex(-1, 5)).toBe(0)
    expect(clampIndex(9, 5)).toBe(4)
    expect(clampIndex(2, 5)).toBe(2)
  })
})

describe('usePresentationNav', () => {
  it('advances and goes back with the keyboard', () => {
    const { result } = renderHook(() => usePresentationNav({ count: 4 }))
    press('ArrowRight')
    press(' ')
    press('PageDown')
    expect(result.current.index).toBe(3)
    press('ArrowLeft')
    press('PageUp')
    expect(result.current.index).toBe(1)
  })

  it('clamps at the start with no wrap-around', () => {
    const { result } = renderHook(() => usePresentationNav({ count: 3 }))
    press('ArrowLeft')
    expect(result.current.index).toBe(0)
  })

  it('clamps at the end with no wrap-around', () => {
    const { result } = renderHook(() => usePresentationNav({ count: 3 }))
    for (let i = 0; i < 6; i++) press('ArrowRight')
    expect(result.current.index).toBe(2)
  })

  it('toggles mode with P while staying on the current step', () => {
    const { result } = renderHook(() => usePresentationNav({ count: 5, initialMode: 'browse' }))
    press('ArrowRight')
    press('ArrowRight')
    press('p')
    expect(result.current.mode).toBe('present')
    expect(result.current.index).toBe(2)
    press('P')
    expect(result.current.mode).toBe('browse')
    expect(result.current.index).toBe(2)
  })

  it('does not hijack keys while an interactive control is focused', () => {
    const { result } = renderHook(() => usePresentationNav({ count: 5 }))
    for (const tag of ['button', 'input', 'select', 'textarea', 'a']) {
      const el = document.createElement(tag)
      if (tag === 'a') el.setAttribute('href', '#x')
      document.body.append(el)
      press('ArrowRight', el)
      press(' ', el)
      el.remove()
    }
    expect(result.current.index).toBe(0)
    expect(isInteractiveTarget(document.body)).toBe(false)
  })

  it('ignores modified keys', () => {
    const { result } = renderHook(() => usePresentationNav({ count: 3 }))
    act(() => {
      fireEvent.keyDown(window, { key: 'ArrowRight', ctrlKey: true })
    })
    expect(result.current.index).toBe(0)
  })

  it('advances on a left swipe and goes back on a right swipe', () => {
    const { result } = renderHook(() => usePresentationNav({ count: 4 }))
    const swipe = (fromX: number, toX: number) =>
      act(() => {
        fireEvent.touchStart(window, { touches: [{ clientX: fromX, clientY: 100 }] })
        fireEvent.touchEnd(window, { changedTouches: [{ clientX: toX, clientY: 102 }] })
      })
    swipe(300, 100)
    swipe(300, 100)
    expect(result.current.index).toBe(2)
    swipe(100, 300)
    expect(result.current.index).toBe(1)
  })
})
