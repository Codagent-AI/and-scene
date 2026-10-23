import { act, fireEvent, render, renderHook, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { actionForKey, actionForSwipe, clampIndex, usePresentationNav } from '../../src/presentation-kit'

const press = (key: string, target: EventTarget = window) =>
  act(() => {
    fireEvent.keyDown(target as Element, { key })
  })

describe('navigation', () => {
  it('maps keys to actions', () => {
    for (const key of ['ArrowRight', ' ', 'PageDown']) expect(actionForKey(key)).toBe('next')
    for (const key of ['ArrowLeft', 'PageUp']) expect(actionForKey(key)).toBe('prev')
    expect(actionForKey('x')).toBeNull()
  })

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

  it('maps swipes: left advances, right goes back, vertical ignored', () => {
    expect(actionForSwipe(-120, 5)).toBe('next')
    expect(actionForSwipe(120, 5)).toBe('prev')
    expect(actionForSwipe(10, 0)).toBeNull()
    expect(actionForSwipe(60, 200)).toBeNull()
  })

  it('reacts to touch events', () => {
    const { result } = renderHook(() => usePresentationNav(5, 'browse'))
    const swipe = (x0: number, x1: number) => {
      act(() => {
        fireEvent.touchStart(window, { touches: [{ clientX: x0, clientY: 100 }] })
        fireEvent.touchEnd(window, { changedTouches: [{ clientX: x1, clientY: 100 }] })
      })
    }
    swipe(300, 100)
    swipe(300, 100)
    expect(result.current.index).toBe(2)
    swipe(100, 300)
    expect(result.current.index).toBe(1)
  })

  it('clamps at both ends without wrapping', () => {
    expect(clampIndex(-1, 4)).toBe(0)
    expect(clampIndex(9, 4)).toBe(3)
    const { result } = renderHook(() => usePresentationNav(3, 'browse'))
    press('ArrowLeft')
    expect(result.current.index).toBe(0)
    press('ArrowRight')
    press('ArrowRight')
    press('ArrowRight')
    press('ArrowRight')
    expect(result.current.index).toBe(2)
  })

  it('toggles the mode with P and keeps the step', () => {
    const { result } = renderHook(() => usePresentationNav(4, 'present'))
    press('ArrowRight')
    press('p')
    expect(result.current.mode).toBe('browse')
    expect(result.current.index).toBe(1)
    press('P')
    expect(result.current.mode).toBe('present')
    expect(result.current.index).toBe(1)
  })

  it('leaves navigation keys to a focused interactive control', () => {
    const { result } = renderHook(() => usePresentationNav(4, 'browse'))
    render(
      <div>
        <button>control</button>
        <input aria-label="field" />
      </div>,
    )
    for (const el of [screen.getByRole('button'), screen.getByLabelText('field')]) {
      press('ArrowRight', el)
      press(' ', el)
    }
    expect(result.current.index).toBe(0)
  })
})
