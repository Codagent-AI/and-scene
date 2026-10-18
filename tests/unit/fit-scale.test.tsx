import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import {
  DESIGN_H,
  DESIGN_W,
  MIN_SCALE,
  STAGE_LAYOUT,
  TOC_W,
  WIDE_VIEWPORT,
  computeFitScale,
  useFitScale,
} from '../../src/presentation-kit'
import { availableStage } from '../../src/presentation-kit/useFitScale'
import { setViewport } from '../support/fixtures'

describe('design canvas constants', () => {
  it('defaults to 880 x 380 with browse and present geometry', () => {
    expect(DESIGN_W).toBe(880)
    expect(DESIGN_H).toBe(380)
    expect(Object.keys(STAGE_LAYOUT).sort()).toEqual(['browse', 'present'])
    for (const geometry of Object.values(STAGE_LAYOUT)) {
      expect(geometry.header).toBeGreaterThan(0)
      expect(geometry.footer).toBeGreaterThan(0)
    }
    expect(STAGE_LAYOUT.browse.footer).toBeGreaterThan(STAGE_LAYOUT.present.footer)
  })
})

describe('computeFitScale', () => {
  const expected = (w: number, h: number, mode: 'browse' | 'present') => {
    const { header, footer, side } = STAGE_LAYOUT[mode]
    const toc = mode === 'browse' && w >= WIDE_VIEWPORT ? TOC_W : 0
    return Math.max(MIN_SCALE, Math.min((w - toc - 2 * side) / DESIGN_W, (h - header - footer) / DESIGN_H))
  }

  it.each([
    [1440, 900, 'browse'],
    [1440, 900, 'present'],
    [390, 844, 'browse'],
    [390, 844, 'present'],
    [1000, 300, 'browse'],
    [2400, 1400, 'present'],
    [3840, 2160, 'present'],
  ] as const)('%ix%i %s uses the smaller of the width and height ratios', (w, h, mode) => {
    expect(computeFitScale(w, h, mode)).toBeCloseTo(expected(w, h, mode), 10)
  })

  it('is height-limited on short wide viewports and width-limited on narrow tall ones', () => {
    const wide = availableStage(1600, 500, 'present')
    expect(wide.height / DESIGN_H).toBeLessThan(wide.width / DESIGN_W)
    const narrow = availableStage(400, 1200, 'present')
    expect(narrow.width / DESIGN_W).toBeLessThan(narrow.height / DESIGN_H)
  })

  it('floors at MIN_SCALE and has no upper cap', () => {
    expect(computeFitScale(50, 50, 'browse')).toBe(MIN_SCALE)
    expect(computeFitScale(5000, 3000, 'present')).toBeGreaterThan(3)
  })

  it('reserves the table-of-contents column only in wide browse mode', () => {
    expect(availableStage(WIDE_VIEWPORT, 900, 'browse').left).toBe(TOC_W)
    expect(availableStage(WIDE_VIEWPORT - 1, 900, 'browse').left).toBe(0)
    expect(availableStage(WIDE_VIEWPORT, 900, 'present').left).toBe(0)
  })
})

describe('useFitScale', () => {
  it('recomputes on resize and mode change, and is constant otherwise', () => {
    setViewport(1440, 900)
    const { result, rerender } = renderHook(({ mode }) => useFitScale(mode), { initialProps: { mode: 'browse' as const } as { mode: 'browse' | 'present' } })
    const browse = result.current
    expect(browse).toBeCloseTo(computeFitScale(1440, 900, 'browse'), 10)
    rerender({ mode: 'browse' })
    expect(result.current).toBe(browse)
    act(() => setViewport(800, 600))
    expect(result.current).toBeCloseTo(computeFitScale(800, 600, 'browse'), 10)
    rerender({ mode: 'present' })
    expect(result.current).toBeCloseTo(computeFitScale(800, 600, 'present'), 10)
    setViewport(1024, 768)
  })
})
