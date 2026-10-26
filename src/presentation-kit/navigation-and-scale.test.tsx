import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { useFitScale } from './useFitScale'
import { usePresentationNav } from './usePresentationNav'

const viewport = { width: window.innerWidth, height: window.innerHeight }

function setViewport(width: number, height: number) {
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: width })
  Object.defineProperty(window, 'innerHeight', { configurable: true, value: height })
}

afterEach(() => setViewport(viewport.width, viewport.height))

describe('presentation navigation and fitting', () => {
  it('clamps the active index when the step list shrinks', () => {
    const { result, rerender } = renderHook(({ count }) => usePresentationNav(count), { initialProps: { count: 2 } })

    act(() => result.current.next())
    rerender({ count: 1 })

    expect(result.current.stepIndex).toBe(0)
  })

  it('scales down below the former minimum when the available stage is very narrow', () => {
    setViewport(100, 400)
    const { result } = renderHook(() => useFitScale('browse'))

    expect(result.current).toBeCloseTo(36 / 880)
  })
})
