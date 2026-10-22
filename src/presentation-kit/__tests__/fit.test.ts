import { describe, expect, it } from 'vitest'
import { DESIGN_H, DESIGN_W, ENTER_DELAY, LAYOUT_T, MIN_SCALE, STAGE_LAYOUT, WIDE_VIEWPORT } from '../constants.ts'
import { fitScale, isWideViewport } from '../useFitScale.ts'

describe('constants', () => {
  it('defaults the design canvas to 880 x 380', () => {
    expect(DESIGN_W).toBe(880)
    expect(DESIGN_H).toBe(380)
  })

  it('has fit geometry for browse and present', () => {
    expect(Object.keys(STAGE_LAYOUT).sort()).toEqual(['browse', 'present'])
  })

  it('makes newcomers wait for the layout morph to finish', () => {
    expect(ENTER_DELAY).toBeGreaterThanOrEqual(LAYOUT_T)
  })

  it('shows the table of contents from 1024px', () => {
    expect(WIDE_VIEWPORT).toBe(1024)
    expect(isWideViewport(1023)).toBe(false)
    expect(isWideViewport(1024)).toBe(true)
  })
})

describe('fitScale', () => {
  const g = STAGE_LAYOUT.present

  it('is limited by width when the viewport is narrow', () => {
    const width = 600
    expect(fitScale(width, 2000, 'present', false)).toBeCloseTo((width - 2 * g.side) / DESIGN_W)
  })

  it('is limited by height when the viewport is short', () => {
    const height = 400
    expect(fitScale(3000, height, 'present', false)).toBeCloseTo((height - g.top - g.bottom) / DESIGN_H)
  })

  it('never drops below MIN_SCALE', () => {
    expect(fitScale(50, 50, 'browse', true)).toBe(MIN_SCALE)
  })

  it('uses each mode own geometry', () => {
    expect(fitScale(1200, 700, 'browse', false)).not.toBe(fitScale(1200, 700, 'present', false))
  })

  it('reserves the table-of-contents column in browse mode', () => {
    const withToc = fitScale(1100, 2000, 'browse', true)
    const without = fitScale(1100, 2000, 'browse', false)
    expect(withToc).toBeLessThan(without)
    expect(without - withToc).toBeCloseTo(STAGE_LAYOUT.browse.tocWidth / DESIGN_W)
  })

  it('scales uniformly (one factor for both axes)', () => {
    expect(typeof fitScale(1300, 800, 'browse', true)).toBe('number')
  })
})
