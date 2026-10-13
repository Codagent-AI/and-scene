import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { computeFitScale, useFitScale } from '../src/presentation-kit/useFitScale'
import { DESIGN_W, DESIGN_H, STAGE_LAYOUT } from '../src/presentation-kit/constants'

 describe('fixed canvas', () => {
  it('uses the specified dimensions and fits both mode geometries uniformly', () => {
    expect([DESIGN_W, DESIGN_H]).toEqual([880, 380])
    for (const mode of ['browse', 'present'] as const) {
      for (const [width, height] of [[1440, 900], [390, 844], [800, 500]]) {
        const { scale, left, right, top, bottom } = computeFitScale(width, height, mode)
        expect(scale * DESIGN_W).toBeLessThanOrEqual(width - left - right)
        expect(scale * DESIGN_H).toBeLessThanOrEqual(height - top - bottom)
        expect(top).toBe(STAGE_LAYOUT[mode].top)
      }
    }
  })
  it('updates on resize and mode change', () => {
    const { result, rerender } = renderHook(({ mode }: { mode: 'browse' | 'present' }) => useFitScale(mode), { initialProps: { mode: 'browse' } })
    act(() => { window.innerWidth = 390; window.innerHeight = 844; window.dispatchEvent(new Event('resize')) })
    expect(result.current.scale).toBe(computeFitScale(390, 844, 'browse').scale)
    rerender({ mode: 'present' })
    expect(result.current.top).toBe(STAGE_LAYOUT.present.top)
  })
})
