// @vitest-environment jsdom
import { act, fireEvent, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useFitScale } from '../src/presentation-kit/useFitScale'
import { usePresentationNav } from '../src/presentation-kit/usePresentationNav'

describe('presentation navigation', () => {
  it('clamps at both ends and supports direct jumps and mode changes', () => {
    const { result } = renderHook(() => usePresentationNav(3))
    act(() => result.current.prev())
    expect(result.current.index).toBe(0)
    act(() => result.current.goTo(2))
    expect(result.current.index).toBe(2)
    act(() => result.current.next())
    expect(result.current.index).toBe(2)
    act(() => result.current.toggleMode())
    expect(result.current.mode).toBe('present')
    expect(result.current.index).toBe(2)
  })

  it('maps keyboard input to step navigation and leaves focused controls alone', () => {
    const { result } = renderHook(() => usePresentationNav(3))
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(result.current.index).toBe(1)
    fireEvent.keyDown(window, { key: 'PageDown' })
    expect(result.current.index).toBe(2)
    fireEvent.keyDown(window, { key: 'ArrowLeft' })
    expect(result.current.index).toBe(1)
    const control = document.createElement('button')
    document.body.append(control)
    fireEvent.keyDown(control, { key: 'ArrowRight' })
    expect(result.current.index).toBe(1)
    control.remove()
  })
})

describe('fixed-canvas fitting', () => {
  it('uses one uniform scale and responds to viewport resizing', () => {
    const originalWidth = window.innerWidth
    const originalHeight = window.innerHeight
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 500 })
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 800 })
    const { result } = renderHook(() => useFitScale(880, 380, 'browse'))
    expect(result.current).toBeCloseTo(416 / 880)
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1200 })
    act(() => window.dispatchEvent(new Event('resize')))
    expect(result.current).toBe(1)
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: originalWidth })
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: originalHeight })
  })
})
