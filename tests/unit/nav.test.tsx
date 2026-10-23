import { act, fireEvent, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { actionForKey, clampIndex, swipeAction, usePresentationNav } from '../../src/presentation-kit/usePresentationNav'

const key = (k: string, target: EventTarget = window) => act(() => void fireEvent.keyDown(target, { key: k }))

describe('navigation', () => {
  it.each([
    ['ArrowRight', 'next'],
    [' ', 'next'],
    ['PageDown', 'next'],
    ['ArrowLeft', 'prev'],
    ['PageUp', 'prev'],
    ['p', 'toggle-mode'],
    ['x', null],
  ])('maps %j to %s', (k, action) => {
    expect(actionForKey(k)).toBe(action)
  })

  it('advances and goes back with the specified keys', () => {
    const { result } = renderHook(() => usePresentationNav(5))
    for (const k of ['ArrowRight', ' ', 'PageDown']) key(k)
    expect(result.current.index).toBe(3)
    for (const k of ['ArrowLeft', 'PageUp']) key(k)
    expect(result.current.index).toBe(1)
  })

  it('clamps at the start and the end without wrapping', () => {
    const { result } = renderHook(() => usePresentationNav(3))
    key('ArrowLeft')
    key('PageUp')
    expect(result.current.index).toBe(0)
    for (let i = 0; i < 6; i++) key('ArrowRight')
    expect(result.current.index).toBe(2)
    act(() => result.current.next())
    expect(result.current.index).toBe(2)
    act(() => result.current.goTo(99))
    expect(result.current.index).toBe(2)
    expect(clampIndex(-4, 3)).toBe(0)
  })

  it('toggles the mode and keeps the step', () => {
    const { result } = renderHook(() => usePresentationNav(5, 'present'))
    key('ArrowRight')
    key('ArrowRight')
    expect(result.current.mode).toBe('present')
    key('p')
    expect(result.current).toMatchObject({ mode: 'browse', index: 2 })
    key('P')
    expect(result.current).toMatchObject({ mode: 'present', index: 2 })
  })

  it.each(['button', 'a', 'input', 'select', 'textarea'])('leaves keys to a focused %s', (tag) => {
    const { result } = renderHook(() => usePresentationNav(5))
    const el = document.createElement(tag)
    if (tag === 'a') el.setAttribute('href', '#x')
    document.body.append(el)
    key('ArrowRight', el)
    key(' ', el)
    key('p', el)
    expect(result.current).toMatchObject({ index: 0, mode: 'browse' })
    el.remove()
  })

  it('maps swipes: left advances, right goes back, short or vertical ones are ignored', () => {
    expect(swipeAction(-120, 5)).toBe('next')
    expect(swipeAction(120, 5)).toBe('prev')
    expect(swipeAction(-20, 0)).toBeNull()
    expect(swipeAction(-80, 200)).toBeNull()
  })

  it('reacts to touch swipes on the window', () => {
    const { result } = renderHook(() => usePresentationNav(5))
    const swipe = (from: number, to: number) =>
      act(() => {
        fireEvent.touchStart(window, { changedTouches: [{ clientX: from, clientY: 100 }] })
        fireEvent.touchEnd(window, { changedTouches: [{ clientX: to, clientY: 100 }] })
      })
    swipe(300, 100)
    swipe(300, 100)
    expect(result.current.index).toBe(2)
    swipe(100, 300)
    expect(result.current.index).toBe(1)
    swipe(100, 130)
    expect(result.current.index).toBe(1)
  })
})
