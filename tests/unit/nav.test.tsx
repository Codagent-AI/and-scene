import { act, cleanup, fireEvent, render, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { usePresentationNav } from '../../src/presentation-kit'

afterEach(cleanup)
const key = (k: string, target: Window | Element = window) => act(() => void fireEvent.keyDown(target, { key: k }))

describe('usePresentationNav', () => {
  it('advances with Right, Space, PageDown and goes back with Left, PageUp', () => {
    const { result } = renderHook(() => usePresentationNav(6))
    key('ArrowRight')
    key(' ')
    key('PageDown')
    expect(result.current.index).toBe(3)
    key('ArrowLeft')
    key('PageUp')
    expect(result.current.index).toBe(1)
  })

  it('clamps at both ends without wrapping', () => {
    const { result } = renderHook(() => usePresentationNav(3))
    key('ArrowLeft')
    expect(result.current.index).toBe(0)
    key('ArrowRight')
    key('ArrowRight')
    key('ArrowRight')
    key('ArrowRight')
    expect(result.current.index).toBe(2)
    act(() => result.current.goTo(99))
    expect(result.current.index).toBe(2)
    act(() => result.current.goTo(-4))
    expect(result.current.index).toBe(0)
  })

  it('toggles mode with P while preserving position and honors initialMode', () => {
    const { result } = renderHook(() => usePresentationNav(4, 'present'))
    expect(result.current.mode).toBe('present')
    key('ArrowRight')
    key('p')
    expect(result.current.mode).toBe('browse')
    expect(result.current.index).toBe(1)
    key('P')
    expect(result.current.mode).toBe('present')
    expect(result.current.index).toBe(1)
  })

  it('leaves keys to focused interactive controls', () => {
    const { result } = renderHook(() => usePresentationNav(4))
    const { getByText } = render(<button>go</button>)
    const button = getByText('go')
    key('ArrowRight', button)
    key(' ', button)
    expect(result.current.index).toBe(0)
  })

  it('ignores modified key chords', () => {
    const { result } = renderHook(() => usePresentationNav(4))
    act(() => void fireEvent.keyDown(window, { key: 'ArrowRight', metaKey: true }))
    expect(result.current.index).toBe(0)
  })

  it('swipes left to advance and right to go back', () => {
    const { result } = renderHook(() => usePresentationNav(4))
    const swipe = (from: number, to: number, dy = 0) => {
      act(() => void fireEvent.touchStart(window, { touches: [{ clientX: from, clientY: 0 }] }))
      act(() => void fireEvent.touchEnd(window, { changedTouches: [{ clientX: to, clientY: dy }] }))
    }
    swipe(300, 100)
    expect(result.current.index).toBe(1)
    swipe(100, 300)
    expect(result.current.index).toBe(0)
    swipe(100, 130)
    swipe(300, 100, 400)
    expect(result.current.index).toBe(0)
  })
})
