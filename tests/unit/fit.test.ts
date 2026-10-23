import { describe, expect, it } from 'vitest'
import {
  DESIGN_H,
  DESIGN_W,
  ENTER_DELAY,
  LAYOUT_T,
  MAX_SCALE,
  MIN_SCALE,
  SWIPE_MIN_PX,
  TOC_MIN_WIDTH,
} from '../../src/presentation-kit/constants'
import { fitScale } from '../../src/presentation-kit/fit'

describe('design canvas constants', () => {
  it('default canvas is 880 x 380', () => {
    expect(DESIGN_W).toBe(880)
    expect(DESIGN_H).toBe(380)
  })

  it('newcomers start only after the layout morph has finished', () => {
    expect(ENTER_DELAY).toBeGreaterThanOrEqual(LAYOUT_T)
  })

  it('swipe threshold and table-of-contents breakpoint match the ruling', () => {
    expect(SWIPE_MIN_PX).toBe(50)
    expect(TOC_MIN_WIDTH).toBe(1024)
  })
})

describe('fitScale', () => {
  const cases = [
    { name: 'wide', size: { width: 1600, height: 900 }, mode: 'browse' as const },
    { name: 'narrow', size: { width: 390, height: 700 }, mode: 'browse' as const },
    { name: 'short', size: { width: 1200, height: 300 }, mode: 'present' as const },
    { name: 'wide present', size: { width: 1600, height: 900 }, mode: 'present' as const },
  ]

  for (const { name, size, mode } of cases) {
    it(`returns one uniform factor that keeps the canvas inside the stage (${name})`, () => {
      const scale = fitScale(size, mode)
      expect(scale).toBeGreaterThanOrEqual(MIN_SCALE)
      expect(scale).toBeLessThanOrEqual(MAX_SCALE)
      const scaledW = DESIGN_W * scale
      const scaledH = DESIGN_H * scale
      const pad = mode === 'browse' ? { x: 24, y: 12 } : { x: 32, y: 24 }
      expect(scaledW).toBeLessThanOrEqual(size.width - pad.x * 2 + 1e-9)
      expect(scaledH).toBeLessThanOrEqual(size.height - pad.y * 2 + 1e-9)
    })
  }

  it('is limited by the tighter axis', () => {
    const wideOnly = fitScale({ width: 1000, height: 10000 }, 'browse')
    const shortOnly = fitScale({ width: 10000, height: 500 }, 'browse')
    expect(wideOnly).toBeCloseTo((1000 - 48) / DESIGN_W)
    expect(shortOnly).toBeCloseTo((500 - 24) / DESIGN_H)
  })

  it('uses per-mode geometry for the same viewport', () => {
    const size = { width: 1000, height: 600 }
    expect(fitScale(size, 'browse')).not.toBeCloseTo(fitScale(size, 'present'))
  })

  it('clamps to the minimum and maximum scale', () => {
    expect(fitScale({ width: 10, height: 10 }, 'browse')).toBe(MIN_SCALE)
    expect(fitScale({ width: 100000, height: 100000 }, 'browse')).toBe(MAX_SCALE)
  })
})
