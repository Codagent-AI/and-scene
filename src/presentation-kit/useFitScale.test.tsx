// @vitest-environment jsdom
import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { setViewport } from '../../tests/helpers/events.ts'
import { DESIGN_H, DESIGN_W, MIN_SCALE, STAGE_LAYOUT } from './constants.ts'
import { computeFitScale, useFitScale } from './useFitScale.ts'

const { top, bottom, side } = STAGE_LAYOUT.browse

describe('computeFitScale', () => {
  it('is limited by width when the space is narrow', () => {
    const width = DESIGN_W / 2 + side * 2
    expect(computeFitScale({ width, height: 5000 }, 'browse')).toBeCloseTo(0.5)
  })

  it('is limited by height when the space is short', () => {
    const height = DESIGN_H * 0.75 + top + bottom
    expect(computeFitScale({ width: 5000, height }, 'browse')).toBeCloseTo(0.75)
  })

  it('uses the same factor when width and height ratios are equal', () => {
    const width = DESIGN_W * 2 + side * 2
    const height = DESIGN_H * 2 + top + bottom
    expect(computeFitScale({ width, height }, 'browse')).toBeCloseTo(2)
  })

  it('never drops below the floor', () => {
    expect(computeFitScale({ width: 50, height: 50 }, 'browse')).toBe(MIN_SCALE)
  })

  it('reserves different chrome room per mode', () => {
    const viewport = { width: 5000, height: 700 }
    expect(computeFitScale(viewport, 'present')).toBeGreaterThan(computeFitScale(viewport, 'browse'))
  })
})

describe('useFitScale', () => {
  it('recomputes one scale on resize and is stable between renders at a fixed size', () => {
    setViewport(1440, 900)
    const { result, rerender } = renderHook(({ mode }) => useFitScale(mode), { initialProps: { mode: 'browse' as const } })
    const first = result.current
    rerender({ mode: 'browse' })
    expect(result.current).toBe(first)
    setViewport(700, 900)
    expect(result.current).toBeCloseTo((700 - side * 2) / DESIGN_W)
    expect(result.current).toBeLessThan(first)
  })

  it('recomputes when the mode changes', () => {
    setViewport(3000, 600)
    const { result, rerender } = renderHook(({ mode }) => useFitScale(mode), { initialProps: { mode: 'browse' as 'browse' | 'present' } })
    const browse = result.current
    rerender({ mode: 'present' })
    expect(result.current).toBeGreaterThan(browse)
  })
})
