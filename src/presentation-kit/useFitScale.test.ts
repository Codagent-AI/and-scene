import { afterEach, describe, expect, it } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useFitScale } from './useFitScale'
import { DESIGN_H, DESIGN_W, MIN_SCALE, STAGE_LAYOUT } from './constants'

function setViewport(width: number, height: number) {
  Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: width })
  Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: height })
  act(() => {
    window.dispatchEvent(new Event('resize'))
  })
}

describe('useFitScale', () => {
  afterEach(() => {
    setViewport(1024, 768)
  })

  it('scales down uniformly to fit the available browse-mode area', () => {
    const insets = STAGE_LAYOUT.browse
    const availableW = DESIGN_W
    const availableH = DESIGN_H / 2
    setViewport(availableW + insets.left + insets.right, availableH + insets.top + insets.bottom)
    const { result } = renderHook(() => useFitScale('browse'))
    const expected = Math.max(MIN_SCALE, Math.min(availableW / DESIGN_W, availableH / DESIGN_H))
    expect(result.current).toBeCloseTo(expected, 5)
  })

  it('never scales below MIN_SCALE', () => {
    setViewport(10, 10)
    const { result } = renderHook(() => useFitScale('present'))
    expect(result.current).toBe(MIN_SCALE)
  })

  it('uses present-mode insets when in present mode', () => {
    const insets = STAGE_LAYOUT.present
    const availableW = DESIGN_W * 2
    const availableH = DESIGN_H * 2
    setViewport(availableW + insets.left + insets.right, availableH + insets.top + insets.bottom)
    const { result } = renderHook(() => useFitScale('present'))
    expect(result.current).toBeCloseTo(2, 5)
  })

  it('recomputes when the viewport resizes', () => {
    setViewport(2000, 2000)
    const { result } = renderHook(() => useFitScale('browse'))
    const first = result.current
    setViewport(400, 400)
    expect(result.current).toBeLessThan(first)
  })
})
