import { act, fireEvent, render, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { clampIndex, keyToAction, swipeToAction, usePresentationNav } from '../../src/presentation-kit/usePresentationNav'

const press = (key: string, target: Element | Window = window, init: KeyboardEventInit = {}) =>
  act(() => {
    fireEvent.keyDown(target, { key, ...init })
  })

const touch = (type: 'touchstart' | 'touchend', x: number, y: number, target: Element | Window = window) =>
  act(() => {
    const e = new Event(type, { bubbles: true })
    Object.defineProperty(e, 'changedTouches', { value: [{ clientX: x, clientY: y }] })
    target.dispatchEvent(e)
  })

describe('keyToAction', () => {
  it.each([
    ['ArrowRight', 'next'],
    [' ', 'next'],
    ['PageDown', 'next'],
    ['ArrowLeft', 'prev'],
    ['PageUp', 'prev'],
    ['p', 'toggle-mode'],
    ['P', 'toggle-mode'],
    ['x', null],
  ])('%j -> %s', (key, action) => expect(keyToAction(key)).toBe(action))
})

describe('swipeToAction', () => {
  it('left advances, right goes back', () => {
    expect(swipeToAction(-120, 5)).toBe('next')
    expect(swipeToAction(120, -5)).toBe('prev')
  })
  it('ignores short and mostly vertical drags', () => {
    expect(swipeToAction(-20, 0)).toBeNull()
    expect(swipeToAction(-80, 200)).toBeNull()
  })
})

describe('clampIndex', () => {
  it('clamps at both ends without wrapping', () => {
    expect(clampIndex(-1, 5)).toBe(0)
    expect(clampIndex(5, 5)).toBe(4)
    expect(clampIndex(2, 5)).toBe(2)
  })
})

describe('usePresentationNav', () => {
  it('advances and goes back with the keyboard', () => {
    const { result } = renderHook(() => usePresentationNav(5, 'browse'))
    press('ArrowRight')
    press(' ')
    press('PageDown')
    expect(result.current.index).toBe(3)
    press('ArrowLeft')
    press('PageUp')
    expect(result.current.index).toBe(1)
  })

  it('clamps at the start', () => {
    const { result } = renderHook(() => usePresentationNav(3, 'browse'))
    press('ArrowLeft')
    expect(result.current.index).toBe(0)
  })

  it('clamps at the end', () => {
    const { result } = renderHook(() => usePresentationNav(3, 'browse'))
    for (let i = 0; i < 6; i++) press('ArrowRight')
    expect(result.current.index).toBe(2)
  })

  it('P toggles the mode and keeps the step', () => {
    const { result } = renderHook(() => usePresentationNav(5, 'browse'))
    press('ArrowRight')
    press('ArrowRight')
    press('p')
    expect(result.current.mode).toBe('present')
    expect(result.current.index).toBe(2)
    press('P')
    expect(result.current.mode).toBe('browse')
    expect(result.current.index).toBe(2)
  })

  it('honours the initial mode', () => {
    const { result } = renderHook(() => usePresentationNav(2, 'present'))
    expect(result.current.mode).toBe('present')
  })

  it('swipe left advances and swipe right goes back', () => {
    const { result } = renderHook(() => usePresentationNav(5, 'browse'))
    touch('touchstart', 300, 100)
    touch('touchend', 120, 105)
    expect(result.current.index).toBe(1)
    touch('touchstart', 100, 100)
    touch('touchend', 260, 100)
    expect(result.current.index).toBe(0)
  })

  it('goTo jumps directly and clamps', () => {
    const { result } = renderHook(() => usePresentationNav(5, 'browse'))
    act(() => result.current.goTo(3))
    expect(result.current.index).toBe(3)
    act(() => result.current.goTo(99))
    expect(result.current.index).toBe(4)
  })

  it('does not hijack keys when an interactive control has focus', () => {
    const { result } = renderHook(() => usePresentationNav(5, 'browse'))
    const { getByRole } = render(
      <>
        <button>control</button>
        <input aria-label="field" />
      </>,
    )
    const button = getByRole('button')
    button.focus()
    press(' ', button)
    press('ArrowRight', button)
    press('p', getByRole('textbox'))
    expect(result.current.index).toBe(0)
    expect(result.current.mode).toBe('browse')
    touch('touchstart', 300, 0, button)
    touch('touchend', 0, 0, button)
    expect(result.current.index).toBe(0)
  })

  it('ignores modified keys', () => {
    const { result } = renderHook(() => usePresentationNav(5, 'browse'))
    press('ArrowRight', window, { ctrlKey: true })
    expect(result.current.index).toBe(0)
  })
})
