import { describe, expect, it } from 'vitest'
import {
  DESIGN_H,
  DESIGN_W,
  MAX_SCALE,
  MIN_SCALE,
  STAGE_LAYOUT,
  computeFitScale,
} from '../../src/presentation-kit/index.ts'

describe('fixed canvas fit scaling', () => {
  it('defaults the design canvas to 880 x 380', () => {
    expect([DESIGN_W, DESIGN_H]).toEqual([880, 380])
  })

  it('has fit geometry for both modes', () => {
    expect(Object.keys(STAGE_LAYOUT).sort()).toEqual(['browse', 'present'])
  })

  it('scales uniformly by the tighter dimension', () => {
    const { padX, padY } = STAGE_LAYOUT.browse
    expect(computeFitScale(DESIGN_W + padX, 10_000, 'browse')).toBeCloseTo(1)
    expect(computeFitScale(10_000, DESIGN_H / 2 + padY, 'browse')).toBeCloseTo(0.5)
  })

  it('rescales when the viewport changes and keeps the canvas aspect ratio', () => {
    const small = computeFitScale(600, 500, 'present')
    const large = computeFitScale(1400, 900, 'present')
    expect(large).toBeGreaterThan(small)
    expect(DESIGN_W * small).toBeLessThanOrEqual(600)
    expect(DESIGN_H * small).toBeLessThanOrEqual(500)
  })

  it('caps the upscale and survives degenerate sizes', () => {
    expect(computeFitScale(99_999, 99_999, 'browse')).toBe(MAX_SCALE)
    expect(computeFitScale(NaN, 100, 'browse')).toBe(1)
    expect(computeFitScale(0, 500, 'browse')).toBe(MIN_SCALE)
    expect(computeFitScale(500, -3, 'present')).toBe(MIN_SCALE)
  })

  it('always fits positive space exactly, even far below the degenerate-size floor', () => {
    for (const [w, h] of [[100, 100], [40, 600], [10, 10], [1, 1]]) {
      const scale = computeFitScale(w, h, 'browse')
      expect(scale).toBeGreaterThan(0)
      expect(DESIGN_W * scale).toBeLessThanOrEqual(w + 1e-9)
      expect(DESIGN_H * scale).toBeLessThanOrEqual(h + 1e-9)
    }
    // a very large custom canvas needs a scale well under any fixed minimum
    const huge = computeFitScale(1000, 800, 'browse', 20_000, 10_000)
    expect(huge).toBeLessThan(0.1)
    expect(20_000 * huge).toBeLessThanOrEqual(1000)
  })

  it('honors a custom design canvas', () => {
    const { padX } = STAGE_LAYOUT.present
    expect(computeFitScale(400 + padX, 10_000, 'present', 400, 200)).toBeCloseTo(1)
  })
})
