import { act, fireEvent, render, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { clampIndex, usePresentationNav } from './usePresentationNav'

function press(key: string, target: Element | Window = window) {
  act(() => {
    fireEvent.keyDown(target, { key })
  })
}

function swipe(fromX: number, toX: number, dy = 0) {
  act(() => {
    fireEvent.touchStart(window, { changedTouches: [{ clientX: fromX, clientY: 100 }] })
    fireEvent.touchEnd(window, { changedTouches: [{ clientX: toX, clientY: 100 + dy }] })
  })
}

describe('usePresentationNav', () => {
  it('advances on Right, Space and PageDown', () => {
    const { result } = renderHook(() => usePresentationNav(9))
    press('ArrowRight')
    press(' ')
    press('PageDown')
    expect(result.current.index).toBe(3)
  })

  it('goes back on Left and PageUp', () => {
    const { result } = renderHook(() => usePresentationNav(9))
    act(() => result.current.goTo(5))
    press('ArrowLeft')
    press('PageUp')
    expect(result.current.index).toBe(3)
  })

  it('clamps at the first step without wrapping', () => {
    const { result } = renderHook(() => usePresentationNav(3))
    press('ArrowLeft')
    act(() => result.current.prev())
    expect(result.current.index).toBe(0)
  })

  it('clamps at the last step without wrapping', () => {
    const { result } = renderHook(() => usePresentationNav(3))
    act(() => result.current.goTo(99))
    expect(result.current.index).toBe(2)
    press('ArrowRight')
    act(() => result.current.next())
    expect(result.current.index).toBe(2)
  })

  it('advances on a left swipe and goes back on a right swipe', () => {
    const { result } = renderHook(() => usePresentationNav(5))
    swipe(300, 100)
    swipe(300, 100)
    expect(result.current.index).toBe(2)
    swipe(100, 300)
    expect(result.current.index).toBe(1)
  })

  it('ignores short or mostly vertical swipes', () => {
    const { result } = renderHook(() => usePresentationNav(5))
    swipe(300, 290)
    swipe(300, 100, 400)
    expect(result.current.index).toBe(0)
  })

  it('toggles mode with P and keeps the current step', () => {
    const { result } = renderHook(() => usePresentationNav(5, 'browse'))
    act(() => result.current.goTo(2))
    press('p')
    expect(result.current.mode).toBe('present')
    expect(result.current.index).toBe(2)
    press('P')
    expect(result.current.mode).toBe('browse')
    expect(result.current.index).toBe(2)
  })

  it('honours the initial mode', () => {
    expect(renderHook(() => usePresentationNav(2, 'browse')).result.current.mode).toBe('browse')
    expect(renderHook(() => usePresentationNav(2)).result.current.mode).toBe('present')
  })

  it('leaves navigation keys to a focused interactive control', () => {
    const { result } = renderHook(() => usePresentationNav(5))
    const { getByRole } = render(
      <>
        <button type="button">control</button>
        <input aria-label="field" />
        <a href="#x">link</a>
      </>,
    )
    for (const el of [getByRole('button'), getByRole('textbox'), getByRole('link')]) {
      press('ArrowRight', el)
      press(' ', el)
      press('p', el)
    }
    expect(result.current.index).toBe(0)
    expect(result.current.mode).toBe('present')
  })

  it('ignores keys combined with modifiers', () => {
    const { result } = renderHook(() => usePresentationNav(5))
    act(() => {
      fireEvent.keyDown(window, { key: 'ArrowRight', metaKey: true })
    })
    expect(result.current.index).toBe(0)
  })
})

describe('clampIndex', () => {
  it('stays within [0, count - 1]', () => {
    expect(clampIndex(-1, 4)).toBe(0)
    expect(clampIndex(9, 4)).toBe(3)
    expect(clampIndex(2, 4)).toBe(2)
    expect(clampIndex(3, 0)).toBe(0)
  })
})
