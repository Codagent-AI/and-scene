import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { usePresentationNav } from './usePresentationNav'

describe('usePresentationNav', () => {
  it('starts on the first step in the requested initial mode', () => {
    const { result } = renderHook(() => usePresentationNav(5, 'present'))
    expect(result.current.stepIndex).toBe(0)
    expect(result.current.mode).toBe('present')
  })

  it('clamps at the last step and does not wrap around', () => {
    const { result } = renderHook(() => usePresentationNav(3))
    act(() => result.current.goTo(2))
    act(() => result.current.next())
    expect(result.current.stepIndex).toBe(2)
  })

  it('clamps at the first step and does not wrap around', () => {
    const { result } = renderHook(() => usePresentationNav(3))
    act(() => result.current.prev())
    expect(result.current.stepIndex).toBe(0)
  })

  it('goTo clamps out-of-range indexes into bounds', () => {
    const { result } = renderHook(() => usePresentationNav(4))
    act(() => result.current.goTo(99))
    expect(result.current.stepIndex).toBe(3)
    act(() => result.current.goTo(-5))
    expect(result.current.stepIndex).toBe(0)
  })

  it('toggleMode preserves the current step', () => {
    const { result } = renderHook(() => usePresentationNav(5))
    act(() => result.current.goTo(3))
    act(() => result.current.toggleMode())
    expect(result.current.mode).toBe('present')
    expect(result.current.stepIndex).toBe(3)
  })

  it('advances on ArrowRight and retreats on ArrowLeft', () => {
    const { result } = renderHook(() => usePresentationNav(3))
    act(() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' })))
    expect(result.current.stepIndex).toBe(1)
    act(() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' })))
    expect(result.current.stepIndex).toBe(0)
  })

  it('does not advance when a keydown targets an interactive control', () => {
    const { result } = renderHook(() => usePresentationNav(3))
    const button = document.createElement('button')
    document.body.appendChild(button)
    act(() => button.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })))
    expect(result.current.stepIndex).toBe(0)
    button.remove()
  })

  it('toggles mode on P', () => {
    const { result } = renderHook(() => usePresentationNav(3))
    act(() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'p' })))
    expect(result.current.mode).toBe('present')
  })

  it('prev moves from the clamped index after stepCount shrinks below it', () => {
    const { result, rerender } = renderHook(({ stepCount }) => usePresentationNav(stepCount), {
      initialProps: { stepCount: 5 },
    })
    act(() => result.current.goTo(4))
    rerender({ stepCount: 3 })
    expect(result.current.stepIndex).toBe(2)
    act(() => result.current.prev())
    expect(result.current.stepIndex).toBe(1)
  })

  it('does not resurrect a stale index when stepCount later expands again', () => {
    const { result, rerender } = renderHook(({ stepCount }) => usePresentationNav(stepCount), {
      initialProps: { stepCount: 5 },
    })
    act(() => result.current.goTo(4))
    rerender({ stepCount: 3 })
    expect(result.current.stepIndex).toBe(2)
    rerender({ stepCount: 5 })
    expect(result.current.stepIndex).toBe(2)
  })
})
