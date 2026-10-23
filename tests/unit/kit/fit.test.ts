import { describe, expect, it } from 'vitest'
import {
  DESIGN_H,
  DESIGN_W,
  ENTER_DELAY,
  LAYOUT_T,
  MIN_SCALE,
  STAGE_LAYOUT,
  WIDE_VIEWPORT_MIN,
} from '../../../src/presentation-kit/constants.ts'
import { computeFitScale } from '../../../src/presentation-kit/useFitScale.ts'

describe('constants', () => {
  it('uses the 880 x 380 default canvas (L-26)', () => {
    expect(DESIGN_W).toBe(880)
    expect(DESIGN_H).toBe(380)
  })

  it('enters newcomers no earlier than the layout move ends (L-5)', () => {
    expect(ENTER_DELAY).toBeGreaterThanOrEqual(LAYOUT_T)
  })

  it('keeps a positive safety margin after the layout move (I-4 strict margin)', () => {
    expect(ENTER_DELAY).toBeGreaterThan(LAYOUT_T)
  })

  it('has per-mode geometry', () => {
    expect(STAGE_LAYOUT.browse.bottom).toBeGreaterThan(STAGE_LAYOUT.present.bottom)
    expect(Object.keys(STAGE_LAYOUT).sort()).toEqual(['browse', 'present'])
  })
})

describe('computeFitScale (L-25)', () => {
  const expected = (vw: number, vh: number, mode: 'browse' | 'present') => {
    const side = mode === 'browse' && vw >= WIDE_VIEWPORT_MIN ? STAGE_LAYOUT.browse.side : 0
    const availW = vw - side
    const availH = vh - STAGE_LAYOUT[mode].top - STAGE_LAYOUT[mode].bottom
    return Math.min(availW / DESIGN_W, availH / DESIGN_H)
  }

  it.each([
    [1280, 720, 'browse'],
    [1280, 720, 'present'],
    [1920, 1080, 'browse'],
    [390, 844, 'browse'],
    [390, 844, 'present'],
    [2000, 600, 'present'],
  ] as const)('is min(width ratio, height ratio) at %i x %i in %s mode', (w, h, mode) => {
    const want = expected(w, h, mode)
    expect(computeFitScale(w, h, mode)).toBeCloseTo(Math.max(want, MIN_SCALE), 10)
  })

  it('reserves the table of contents only on wide browse viewports', () => {
    expect(computeFitScale(899, 2000, 'browse')).toBeCloseTo(899 / DESIGN_W, 10)
    expect(computeFitScale(900, 2000, 'browse')).toBeCloseTo((900 - STAGE_LAYOUT.browse.side) / DESIGN_W, 10)
  })

  it('differs between modes for the same viewport', () => {
    expect(computeFitScale(1280, 720, 'present')).toBeGreaterThan(computeFitScale(1280, 720, 'browse'))
  })

  it.each([
    [0, 0],
    [100, 50],
    [Number.NaN, 700],
  ])('clamps degenerate viewports (%s x %s) to a finite positive scale', (w, h) => {
    const s = computeFitScale(w, h, 'browse')
    expect(Number.isFinite(s)).toBe(true)
    expect(s).toBeGreaterThanOrEqual(MIN_SCALE)
  })

  it('uses a design override', () => {
    expect(computeFitScale(1280, 720, 'present', { width: 400, height: 200 })).toBeCloseTo(
      Math.min(1280 / 400, (720 - STAGE_LAYOUT.present.top - STAGE_LAYOUT.present.bottom) / 200),
      10,
    )
  })
})
